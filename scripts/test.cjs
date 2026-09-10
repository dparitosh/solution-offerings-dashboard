const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, filename);
const { ALL_QUARTER_OFFERINGS, ALL_QUARTER_ACTIONS, REGIONS } = require('../src/data/initialData.ts');
const { recalculateSub, setSubTotal, sumSubRegions, resolveAction, initialActionScope, matchesSubFilters, metricFields } = require('../src/utils/dataIntegrity.ts');
const { calculateExecutiveKPIs, calculateOfferingRollup, calculateOwnerPerformances, buildWorkbook, parseExcelImport } = require('../src/utils/calculations.ts');
const XLSX = require('xlsx');
const quarter = 'Q1 FY 27';
const offerings = structuredClone(ALL_QUARTER_OFFERINGS[quarter]);
const actions = ALL_QUARTER_ACTIONS[quarter];
const first = offerings[0].subOfferings[0];
let count = 0;
function test(name, fn) { try { fn(); count++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`, error); process.exitCode = 1; } }
const serialize = wb => XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
const imported = wb => parseExcelImport(serialize(wb), offerings, actions, quarter);

test('All seeded action IDs belong to the correct parent and quarter', () => {
  for (const [q, offs] of Object.entries(ALL_QUARTER_OFFERINGS)) for (const action of ALL_QUARTER_ACTIONS[q]) {
    const resolved = resolveAction(action, offs);
    assert.equal(resolved.offeringName, action.offeringName);
    assert.equal(resolved.subOfferingName, action.subOfferingName);
  }
});
test('Zero revenue remains zero in executive and owner totals', () => {
  const off = { ...offerings[0], subOfferings: [{ ...first, revenueActual: 0 }] };
  assert.equal(calculateExecutiveKPIs([off]).totalRevenueActual, 0);
  assert.equal(calculateOwnerPerformances([off], []).reduce((sum, o) => sum + o.totalRevenueActual, 0), 0);
});
test('Total edits redistribute regions with no rounding loss, including zero', () => {
  for (const field of metricFields) for (const amount of [0, 0.01, 23.47, 1000]) {
    const sub = setSubTotal(first, field, amount);
    assert.ok(Math.abs(Object.values(sub.regionalBreakdown).reduce((n, r) => n + r[field], 0) - amount) < 1e-8);
    assert.equal(sub[field], amount);
  }
});
test('Regional edit rolls through sub-offering and parent gap/status', () => {
  let sub = structuredClone(first);
  for (const r of Object.values(sub.regionalBreakdown)) r.pipelineActual = r.tcvActual = r.revenueActual = 0;
  sub = sumSubRegions(sub);
  assert.equal(sub.status, 'Critical Gap');
  assert.equal(sub.pipelineActual, 0);
  assert.equal(calculateOfferingRollup([sub]).pipelineGap, -sub.pipelineAop);
  for (const metric of ['pipeline', 'tcv', 'revenue']) sub = setSubTotal(sub, `${metric}Actual`, sub[`${metric}Aop`]);
  assert.equal(sub.status, 'Surplus');
});
test('Owner, status and search filters intersect', () => {
  const filters = { quarter, region: 'All Regions', offeringId: 'All', owner: first.owner, searchQuery: 'no matching phrase', statusFilter: 'All', unit: 'M' };
  assert.equal(matchesSubFilters(offerings[0], first, filters), false);
  filters.searchQuery = ''; filters.statusFilter = first.status === 'Surplus' ? 'Critical Gap' : 'Surplus';
  assert.equal(matchesSubFilters(offerings[0], first, filters), false);
  filters.statusFilter = 'All'; assert.equal(matchesSubFilters(offerings[0], first, filters), true);
});
test('Quick action preserves selected parent and selected child', () => {
  const off = offerings[2], sub = off.subOfferings[1];
  assert.deepEqual(initialActionScope(offerings, { offeringId: off.id, subOfferingId: sub.id }), { offeringId: off.id, subOfferingId: sub.id });
  assert.deepEqual(initialActionScope(offerings, { offeringId: off.id, subOfferingId: '' }), { offeringId: off.id, subOfferingId: '' });
});
test('Action cannot be saved under another practice parent or quarter', () => {
  assert.throws(() => resolveAction({ ...actions[0], offeringId: offerings[3].id }, offerings));
  assert.throws(() => resolveAction({ ...actions[0], targetQuarter: 'Q2 FY 27' }, offerings));
});
test('Parent-only action and completed progress resolve correctly', () => {
  const action = resolveAction({ ...actions[0], subOfferingId: '', status: 'Completed', progressPercent: 30 }, offerings);
  assert.equal(action.subOfferingName, ''); assert.equal(action.progressPercent, 100);
});
test('All quarterly workbooks round trip with correct action parents', () => {
  for (const [q, offs] of Object.entries(ALL_QUARTER_OFFERINGS)) {
    const acts = ALL_QUARTER_ACTIONS[q];
    const result = parseExcelImport(serialize(buildWorkbook(offs, acts)), offs, acts, q);
    assert.equal(result.error, undefined);
    assert.equal(result.offerings.length, offs.length); assert.equal(result.actions.length, acts.length);
    result.actions.forEach(a => resolveAction(a, result.offerings));
  }
});
test('A workbook imports into a clean environment using stable IDs', () => {
  const result = parseExcelImport(serialize(buildWorkbook(offerings, actions)), [], [], quarter);
  assert.equal(result.error, undefined);
  assert.equal(result.actions[0].subOfferingId, actions[0].subOfferingId);
});
test('Empty registry round trips and clears actions', () => {
  const result = imported(buildWorkbook(offerings, []));
  assert.equal(result.error, undefined); assert.equal(result.actions.length, 0);
});
test('Malformed workbook is rejected without partial records', () => {
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Wrong'], [123]]), 'Data');
  const result = imported(wb); assert.ok(result.error); assert.equal(result.offerings.length, 0);
});
test('Foreign action parent is rejected transactionally', () => {
  const wb = buildWorkbook(offerings, [{ ...actions[0], offeringId: offerings[3].id, offeringName: offerings[3].name }]);
  const result = imported(wb); assert.ok(result.error); assert.equal(result.offerings.length, 0);
});
test('Master-only workbook imports changed values and redistributes regions', () => {
  const wb = buildWorkbook(offerings, actions);
  delete wb.Sheets['Regional Breakdown']; wb.SheetNames = wb.SheetNames.filter(n => n !== 'Regional Breakdown');
  const sheet = wb.Sheets['Offerings & Sub-Offerings'];
  const data = XLSX.utils.sheet_to_json(sheet);
  data[1]['Revenue Actual ($M)'] = 0;
  wb.Sheets['Offerings & Sub-Offerings'] = XLSX.utils.json_to_sheet(data);
  const result = imported(wb); assert.equal(result.error, undefined);
  const sub = result.offerings[0].subOfferings[0]; assert.equal(sub.revenueActual, 0);
  assert.equal(Object.values(sub.regionalBreakdown).reduce((n, r) => n + r.revenueActual, 0), 0);
});
test('Mismatched master and regional totals are rejected', () => {
  const wb = buildWorkbook(offerings, actions); const sheet = XLSX.utils.sheet_to_json(wb.Sheets['Regional Breakdown']);
  sheet[0]['Pipeline Actual ($M)'] = 12345;
  wb.Sheets['Regional Breakdown'] = XLSX.utils.json_to_sheet(sheet);
  assert.match(imported(wb).error, /Regional totals/);
});
test('Saved edits and actions survive a storage round trip', () => {
  const { saveDashboard, loadDashboard } = require('../src/utils/storage.ts');
  const data = structuredClone({ allOfferings: ALL_QUARTER_OFFERINGS, allActions: ALL_QUARTER_ACTIONS });
  data.allOfferings[quarter][0].subOfferings[0] = setSubTotal(first, 'pipelineActual', 123.45);
  data.allActions[quarter].push({ ...actions[0], id: 'storage-test', title: 'Persisted action' });
  let raw;
  const storage = { getItem: () => raw, setItem: (key, value) => { raw = value; } };
  saveDashboard(storage, data);
  const restored = loadDashboard(storage);
  assert.equal(restored.allOfferings[quarter][0].subOfferings[0].pipelineActual, 123.45);
  assert.ok(restored.allActions[quarter].some(a => a.id === 'storage-test'));
  assert.equal(restored.allActions['Q2 FY 27'].some(a => a.id === 'storage-test'), false);
});
test('Corrupted storage reports an error', () => {
  const { loadDashboard } = require('../src/utils/storage.ts');
  assert.throws(() => loadDashboard({ getItem: () => '{bad data' }));
  assert.throws(() => loadDashboard({ getItem: () => '{}' }));
});
test('Negative and non-finite metrics are rejected', () => {
  for (const value of [-1, Infinity, NaN]) assert.throws(() => setSubTotal(first, 'pipelineActual', value));
});
test('An edited practice name is reflected on its linked action', () => {
  const changed = structuredClone(offerings);
  const action = actions[0];
  const off = changed.find(o => o.id === action.offeringId);
  off.name = 'Renamed parent';
  off.subOfferings.find(s => s.id === action.subOfferingId).name = 'Renamed practice';
  const resolved = resolveAction(action, changed);
  assert.equal(resolved.offeringName, 'Renamed parent'); assert.equal(resolved.subOfferingName, 'Renamed practice');
});
test('Executive brief includes accurate totals, currency and action parents', () => {
  const { buildExecutiveSummary, priorityActions } = require('../src/utils/executiveBrief.ts');
  const filters = { quarter, unit: 'M' };
  const summary = buildExecutiveSummary(offerings, actions, filters, new Date('2026-09-09T00:00:00Z'));
  assert.match(summary, /Pipeline: \$109\.5M/);
  assert.match(summary, /Quarter: Q1 FY 27/);
  priorityActions(actions).forEach(action => {
    assert.ok(summary.includes(`${action.offeringName} > ${action.subOfferingName || 'Entire offering'}`));
    assert.ok(summary.includes(action.rootCause)); assert.ok(summary.includes(action.description));
  });
  assert.ok(priorityActions(actions).every(a => a.status !== 'Completed'));
  assert.match(buildExecutiveSummary(offerings, actions, { ...filters, unit: 'INR_Cr' }), /₹914\.33 Cr/);
});
test('Export retains stable scope IDs, all action details and valid zero values', () => {
  const off = structuredClone(offerings[0]); off.subOfferings[0] = setSubTotal(off.subOfferings[0], 'revenueActual', 0);
  Object.assign(off, calculateOfferingRollup(off.subOfferings));
  const wb = buildWorkbook([off], actions.filter(a => a.offeringId === off.id));
  const master = XLSX.utils.sheet_to_json(wb.Sheets['Offerings & Sub-Offerings']);
  assert.equal(master[1]['Revenue Actual ($M)'], 0); assert.equal(master[1]['Offering ID'], off.id);
  const registry = XLSX.utils.sheet_to_json(wb.Sheets['Remedial Actions']);
  registry.forEach(row => { const a = actions.find(a => a.id === row['Action ID']); assert.equal(row['Remedial Action Details'], a.description); assert.equal(row['Sub-Offering ID'], a.subOfferingId); assert.equal(row['Root Cause'], a.rootCause); });
});
const { reviewMapping, inspectWorkbook, mappingFields } = require('../src/utils/importMapping.ts');
const mappingRow = (source = 'Original', sub = 'Detail', updated = 'Updated') => ({ Offering: source, 'Sub-offering': sub, 'Updated Offering': updated, Owner: 'Owner', ...Object.fromEntries(mappingFields.slice(4, 10).map(f => [f, f.includes('Actual') ? 0 : 5])), 'Pipeline Remedial Actions': 'Build pipeline with named accounts' });
const mappingBuffer = rows => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Source'); return serialize(wb); };
const mappingOptions = { mode: 'mapped', sheet: 'Source', headerRow: 1, startRow: 2, endRow: 2, columns: Object.fromEntries(mappingFields.map(f => [f, f === 'TCV Remedial Actions' || f === 'Revenue Remedial Actions' ? '' : f])), relationship: 'tag', grouping: 'offering' };
test('Mapped tags and peers retain metrics exactly once and preserve source plans', () => {
  for (const relationship of ['tag', 'peer']) {
    const result = reviewMapping(mappingBuffer([mappingRow()]), { ...mappingOptions, relationship }, [], [], quarter);
    assert.equal(result.error, undefined); assert.equal(result.offerings[0].name, 'Original');
    assert.equal(result.offerings[0].pipelineActual, 0); assert.equal(result.offerings[0].pipelineAop, 5);
    assert.equal(result.offerings[0].subOfferings[0].mapping.relationship, relationship);
    assert.equal(result.offerings[0].subOfferings[0].pipelineRemedialActions, 'Build pipeline with named accounts');
  }
});
test('Parent mapping moves child actions and parent actions to the correct updated parent', () => {
  const off = offerings[0], sub = off.subOfferings[0];
  const selectedActions = actions.filter(a => a.offeringId === off.id && (!a.subOfferingId || a.subOfferingId === sub.id));
  assert.ok(selectedActions.length);
  const result = reviewMapping(mappingBuffer([mappingRow(off.name, sub.name, 'New parent')]), { ...mappingOptions, relationship: 'parent-child' }, offerings, selectedActions, quarter);
  assert.equal(result.error, undefined); assert.equal(result.offerings[0].name, 'New parent');
  assert.equal(result.offerings[0].subOfferings[0].id, sub.id);
  assert.equal(result.offerings[0].pipelineRemedialActions, off.pipelineRemedialActions);
  result.actions.forEach(a => { assert.equal(a.offeringId, result.offerings[0].id); assert.equal(a.offeringName, 'New parent'); });
  const repeated = reviewMapping(mappingBuffer([mappingRow(off.name, sub.name, 'New parent')]), { ...mappingOptions, relationship: 'parent-child' }, result.offerings, result.actions, quarter);
  assert.equal(repeated.error, undefined); assert.equal(repeated.offerings[0].subOfferings[0].id, sub.id);
  assert.equal(repeated.offerings[0].subOfferings[0].winRate, sub.winRate);
});
test('Mapping scope excludes unselected rows and supports sub-offering grouping', () => {
  const data = mappingBuffer([mappingRow('One', 'Group'), mappingRow('Two', 'Group')]);
  const result = reviewMapping(data, { ...mappingOptions, startRow: 3, endRow: 3, grouping: 'sub-offering' }, [], [], quarter);
  assert.equal(result.error, undefined); assert.equal(result.offerings[0].name, 'Group'); assert.equal(result.offerings[0].subOfferings[0].name, 'Two');
  assert.equal(result.offerings[0].pipelineAop, 5); assert.equal(result.offerings[0].subOfferings[0].mapping.sourceRow, 3);
  assert.equal(inspectWorkbook(data)[0].rowCount, 3);
});
test('Mapping rejects missing metrics, duplicate column assignments, invalid scope and duplicate rows', () => {
  const data = mappingBuffer([mappingRow()]);
  assert.match(reviewMapping(data, { ...mappingOptions, columns: { ...mappingOptions.columns, 'Revenue Actual ($M)': '' } }, [], [], quarter).error, /Map Revenue/);
  assert.match(reviewMapping(data, { ...mappingOptions, columns: { ...mappingOptions.columns, Owner: 'Offering' } }, [], [], quarter).error, /only once/);
  assert.match(reviewMapping(data, { ...mappingOptions, startRow: 1 }, [], [], quarter).error, /Source rows/);
  assert.match(reviewMapping(mappingBuffer([mappingRow(), mappingRow()]), { ...mappingOptions, endRow: 3 }, [], [], quarter).error, /duplicate detail/);
});
test('Parent mapping rejects cycles and conflicting parents', () => {
  const opts = { ...mappingOptions, relationship: 'parent-child', endRow: 3 };
  assert.match(reviewMapping(mappingBuffer([mappingRow('A', 'one', 'B'), mappingRow('B', 'two', 'A')]), opts, [], [], quarter).error, /cycle/);
  assert.match(reviewMapping(mappingBuffer([mappingRow('A', 'one', 'B'), mappingRow('A', 'two', 'C')]), opts, [], [], quarter).error, /conflicting/);
});
test('Mapping refuses to orphan actions outside the replacement scope', () => {
  const result = reviewMapping(mappingBuffer([mappingRow()]), mappingOptions, offerings, actions, quarter);
  assert.ok(result.error); assert.equal(result.offerings.length, 0);
});
test('Relationship and source provenance survive Excel round trip', () => {
  const result = reviewMapping(mappingBuffer([mappingRow()]), mappingOptions, [], [], quarter);
  const restored = parseExcelImport(serialize(buildWorkbook(result.offerings, [])), [], [], quarter);
  assert.equal(restored.error, undefined); assert.deepEqual(restored.offerings[0].subOfferings[0].mapping, result.offerings[0].subOfferings[0].mapping);
  const original = structuredClone(result.offerings); original[0].subOfferings[0].mapping = undefined;
  const cleared = parseExcelImport(serialize(buildWorkbook(original, [])), result.offerings, [], quarter);
  assert.equal(cleared.error, undefined); assert.equal(cleared.offerings[0].subOfferings[0].mapping, undefined);
});
test('Multiple sheets combine into one group with unique IDs and original source rows', () => {
  const wb = XLSX.utils.book_new();
  for (const [name, detail] of [['East', 'One'], ['West', 'Two']]) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([mappingRow('Original', detail)]), name);
  const result = reviewMapping(serialize(wb), ['East', 'West'].map(sheet => ({ ...mappingOptions, sheet })), [], [], quarter);
  assert.equal(result.error, undefined); assert.equal(result.offerings.length, 1); assert.equal(result.offerings[0].pipelineAop, 10);
  const subs = result.offerings[0].subOfferings;
  assert.equal(new Set(subs.map(s => s.id)).size, 2); assert.deepEqual(subs.map(s => s.mapping.sourceSheet), ['East', 'West']);
  const restored = parseExcelImport(serialize(buildWorkbook(result.offerings, [])), [], [], quarter);
  assert.equal(restored.error, undefined); assert.deepEqual(restored.offerings[0].subOfferings.map(s => s.mapping), subs.map(s => s.mapping));
});
test('Cross-sheet duplicates and parent cycles fail the whole import', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([mappingRow('A', 'One', 'B')]), 'East');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([mappingRow('A', 'One', 'B')]), 'West');
  const opts = ['East', 'West'].map(sheet => ({ ...mappingOptions, sheet }));
  assert.match(reviewMapping(serialize(wb), opts, [], [], quarter).error, /West:.*duplicate/);
  wb.Sheets.West = XLSX.utils.json_to_sheet([mappingRow('B', 'Two', 'A')]);
  assert.match(reviewMapping(serialize(wb), opts.map(o => ({ ...o, relationship: 'parent-child' })), [], [], quarter).error, /cycle/);
});
test('Multi-sheet validation retains actions that span different sheets', () => {
  const off = offerings[0]; const wb = XLSX.utils.book_new();
  off.subOfferings.forEach((sub, i) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([mappingRow(off.name, sub.name, 'Combined')]), `Part${i}`));
  const result = reviewMapping(serialize(wb), wb.SheetNames.map(sheet => ({ ...mappingOptions, sheet, relationship: 'parent-child' })), offerings, actions.filter(a => a.offeringId === off.id), quarter);
  assert.equal(result.error, undefined); assert.ok(result.actions.length); result.actions.forEach(a => assert.equal(a.offeringId, result.offerings[0].id));
});
test('Header detection handles title rows and suggestions leave ambiguous headers unmapped', () => {
  const { suggestColumns } = require('../src/utils/importMapping.ts');
  const row = mappingRow(), wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Customer report'], [], Object.keys(row), Object.values(row)]), 'Source');
  const info = inspectWorkbook(serialize(wb))[0]; assert.equal(info.headerRow, 3);
  assert.equal(suggestColumns(['Offering Name', 'New Offering'])['Offering'], 'Offering Name');
  assert.equal(suggestColumns(['Offering', 'Offering Name'])['Offering'], 'Offering');
  assert.equal(suggestColumns(['Offering Name', 'Solution Offering'])['Offering'], '');
  assert.equal(suggestColumns(['Offering', 'Offering'])['Offering'], '');
  assert.equal(suggestColumns(['Pipeline Planned'])['Pipeline AOP ($M)'], 'Pipeline Planned');
  const result = reviewMapping(serialize(wb), { ...mappingOptions, headerRow: 3, startRow: 4, endRow: 4 }, [], [], quarter);
  assert.equal(result.error, undefined); assert.equal(result.offerings[0].subOfferings[0].mapping.sourceRow, 4);
  const offset = XLSX.utils.aoa_to_sheet([]);
  XLSX.utils.sheet_add_aoa(offset, [Object.keys(row), Object.values(row)], { origin: 'A3' });
  wb.Sheets.Source = offset;
  assert.equal(inspectWorkbook(serialize(wb))[0].headerRow, 3);
  const offsetResult = reviewMapping(serialize(wb), { ...mappingOptions, headerRow: 3, startRow: 4, endRow: 4 }, [], [], quarter);
  assert.equal(offsetResult.error, undefined); assert.equal(offsetResult.offerings[0].subOfferings[0].mapping.sourceRow, 4);
});
test('Invalid sheet metrics identify the sheet and row and mixed quarters are rejected', () => {
  assert.match(reviewMapping(mappingBuffer([{ ...mappingRow(), 'Revenue Actual ($M)': 'invalid' }]), mappingOptions, [], [], quarter).error, /Source: Row 2: Revenue/);
  assert.match(reviewMapping(mappingBuffer([{ ...mappingRow(), Quarter: 'Q2 FY 27' }]), mappingOptions, [], [], quarter).error, /quarter differs/);
  assert.match(reviewMapping(mappingBuffer([mappingRow()]), [], [], [], quarter).error, /at least one/);
});
console.log(`${count} data tests passed.`);
const serverTests = require('node:child_process').spawnSync(process.execPath, ['--test', require('node:path').join(__dirname, '../tests/server.test.mjs')], { stdio: 'inherit' });
if (serverTests.status !== 0) process.exitCode = 1;
