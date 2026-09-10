import * as XLSX from 'xlsx';
import { Offering, QuarterType, RemedialAction } from '../types/dashboard';
import { parseExcelImport, ImportResult } from './excelImport';
import { metricFields, setSubTotal } from './dataIntegrity';

export const mappingFields = ['Offering', 'Sub-offering', 'Updated Offering', 'Owner', 'Pipeline AOP ($M)', 'Pipeline Actual ($M)', 'TCV AOP ($M)', 'TCV Actual ($M)', 'Revenue AOP ($M)', 'Revenue Actual ($M)', 'Pipeline Remedial Actions', 'TCV Remedial Actions', 'Revenue Remedial Actions'] as const;
export type Relationship = 'tag' | 'parent-child' | 'peer';
export interface MappingOptions {
  sheet: string; headerRow: number; startRow: number; endRow: number;
  columns: Record<string, string>; relationship: Relationship;
  grouping: 'offering' | 'sub-offering'; mode: 'template' | 'mapped';
}
export interface SheetInfo { name: string; rowCount: number; headerRow: number; headers: string[]; sample: string[][] }
const value = (v: unknown) => String(v ?? '').trim();
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function suggestColumns(headers: string[]): Record<string, string> {
  const aliases: Record<string, string[]> = {
    Offering: ['Offering Name', 'Solution Offering'], 'Sub-offering': ['Sub offering Name', 'Sub Offering Name'],
    'Updated Offering': ['Updated Offering Name', 'New Offering', 'Mapped Offering'], Owner: ['Offering Owner', 'Responsible Owner']
  };
  return Object.fromEntries(mappingFields.map(field => {
    const exact = headers.filter(h => normalize(h) === normalize(field));
    if (exact.length) return [field, exact.length === 1 ? exact[0] : ''];
    const names = [field, ...(aliases[field] || [])];
    if (field.includes('($M)')) names.push(field.replace(' ($M)', ''), field.replace('AOP', 'Planned'), field.replace('AOP ($M)', 'Planned'), field.replace('AOP ($M)', 'Target'), field.replace('Actual ($M)', 'Actuals'));
    const matches = headers.filter(h => names.some(n => normalize(n) === normalize(h)));
    return [field, matches.length === 1 ? matches[0] : ''];
  }));
}
export function requiredMappingFields(options: MappingOptions): string[] {
  return ['Offering', 'Updated Offering', ...mappingFields.slice(4, 10), ...(options.relationship !== 'parent-child' && options.grouping === 'sub-offering' ? ['Sub-offering'] : [])];
}
export function inspectWorkbook(data: ArrayBuffer, headerRow?: number): SheetInfo[] {
  const wb = XLSX.read(data, { type: 'array' });
  return wb.SheetNames.map(name => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, range: 0, defval: '', blankrows: true });
    const detected = headerRow ?? rows.slice(0, 25).reduce((best, row, index) => {
      const score = Object.values(suggestColumns(row.map(value))).filter(Boolean).length;
      return score > best.score ? { score, row: index + 1 } : best;
    }, { score: 0, row: 1 }).row;
    return { name, rowCount: rows.length, headerRow: detected, headers: (rows[detected - 1] || []).map(value), sample: rows.slice(detected, detected + 3).map(row => row.map(value)) };
  });
}

export function reviewMapping(data: ArrayBuffer, input: MappingOptions | MappingOptions[], current: Offering[], actions: RemedialAction[], quarter: QuarterType): ImportResult {
  const selections = Array.isArray(input) ? input : [input];
  if (selections.length === 1 && selections[0].mode === 'template') return parseExcelImport(data, current, actions, quarter);
  try {
    if (!selections.length) throw new Error('Select at least one worksheet.');
    if (new Set(selections.map(s => s.sheet)).size !== selections.length) throw new Error('Select each worksheet only once.');
    const relationship = selections[0].relationship;
    if (selections.some(s => s.mode !== 'mapped' || s.relationship !== relationship || s.grouping !== selections[0].grouping)) throw new Error('Use the same relationship and grouping for all selected sheets.');
    const wb = XLSX.read(data, { type: 'array' });
    const groups = new Map<string, { id: number; rows: Record<string, unknown>[] }>();
    const links = new Map<string, { parent: number; name: string; source: string; updated: string; sub: string; row: number; sheet: string }>();
    const oldParentTargets = new Map<number, Set<number>>();
    let nextId = Math.max(0, ...current.map(o => o.id)) + 1;
    for (const options of selections) {
    try {
    if (!wb.Sheets[options.sheet]) throw new Error('Select a worksheet.');
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[options.sheet], { header: 1, range: 0, defval: '', blankrows: true });
    const { headerRow, startRow, endRow, columns, relationship } = options;
    const grouping = relationship === 'parent-child' ? 'offering' : options.grouping;
    if (![headerRow, startRow, endRow].every(Number.isInteger) || headerRow < 1 || startRow <= headerRow || endRow < startRow || endRow > rows.length) throw new Error('Source rows must be after the header and within the worksheet.');
    const headers = (rows[headerRow - 1] || []).map(value);
    const required = requiredMappingFields(options);
    for (const field of required) if (!columns[field]) throw new Error(`Map ${field}.`);
    const selected = Object.values(columns).filter(Boolean);
    if (new Set(selected).size !== selected.length) throw new Error('Map each source column only once.');
    for (const column of selected) if (headers.filter(h => h === column).length !== 1) throw new Error(`Column ${column} is missing or has duplicate headers.`);
    const get = (row: unknown[], field: string) => columns[field] ? row[headers.indexOf(columns[field])] : '';
    for (let n = startRow; n <= endRow; n++) {
      const row = rows[n - 1] || [];
      if (row.every(v => value(v) === '')) continue;
      const sourceQuarter = headers.findIndex(h => normalize(h) === 'quarter');
      if (sourceQuarter >= 0 && value(row[sourceQuarter]) && value(row[sourceQuarter]) !== quarter) throw new Error(`Row ${n}: quarter differs from ${quarter}. Select sheets and rows for the selected quarter only.`);
      for (const field of mappingFields.slice(4, 10)) {
        const raw = get(row, field), numeric = Number(value(raw).replace(/,/g, ''));
        if (!value(raw) || !Number.isFinite(numeric) || numeric < 0) throw new Error(`Row ${n}: ${field} must contain a non-negative number.`);
      }
      const source = value(get(row, 'Offering')), sub = value(get(row, 'Sub-offering')), updated = value(get(row, 'Updated Offering'));
      if (!source || !updated || (grouping === 'sub-offering' && !sub)) throw new Error(`Row ${n}: offering, updated offering and grouping value are required. Select detail rows only.`);
      if (relationship !== 'tag' && source === updated) throw new Error(`Row ${n}: an offering cannot be its own parent or peer.`);
      const groupName = relationship === 'parent-child' ? updated : grouping === 'sub-offering' ? sub : source;
      const childName = relationship === 'parent-child' ? (sub ? `${source} / ${sub}` : source) : grouping === 'sub-offering' ? source : sub || source;
      const matches = current.flatMap(o => o.subOfferings.filter(s =>
        (o.name === source && s.name === (sub || source)) ||
        (s.mapping?.sourceOffering === source && s.mapping.sourceSubOffering === sub)
      ).map(s => ({ offering: o, sub: s })));
      if (matches.length > 1) throw new Error(`Row ${n}: source matches multiple existing details.`);
      const prior = matches[0]?.offering || current.find(o => o.name === source);
      const priorSub = matches[0]?.sub;
      let group = groups.get(groupName);
      if (!group) { group = { id: current.find(o => o.name === groupName)?.id ?? nextId++, rows: [] }; groups.set(groupName, group); }
      const id = priorSub?.id || `mapped-${group.id}-${encodeURIComponent(options.sheet)}-${n}-${quarter.replace(/\s/g, '')}`;
      if (links.has(id) || group.rows.some(r => r['Sub offering Name'] === childName)) throw new Error(`Row ${n}: duplicate detail row ${childName}. Select a scope without repeated totals.`);
      if (prior) { const targets = oldParentTargets.get(prior.id) || new Set<number>(); targets.add(group.id); oldParentTargets.set(prior.id, targets); }
      links.set(id, { parent: group.id, name: childName, source, updated, sub, row: n, sheet: options.sheet });
      group.rows.push({ 'Offering ID': group.id, 'Sub-Offering ID': id, 'Sub offering Name': childName, Owner: columns.Owner ? get(row, 'Owner') : priorSub?.owner || '', Quarter: quarter,
        ...Object.fromEntries(mappingFields.slice(4).map(field => [field, get(row, field)])),
        ...Object.fromEntries(['Pipeline', 'TCV', 'Revenue'].filter(type => !columns[`${type} Remedial Actions`]).map(type => [`${type} Remedial Actions`, priorSub?.[`${type.toLowerCase()}RemedialActions` as 'pipelineRemedialActions'] || ''])) });
    }
    } catch (error) { throw new Error(`${options.sheet}: ${error instanceof Error ? error.message : 'Invalid mapping.'}`); }
    }
    if (!links.size) throw new Error('The selected source scope contains no detail rows.');
    // Reject cycles across the proposed parent relationships before generating totals.
    if (relationship === 'parent-child') {
      const parents = new Map<string, string>();
      for (const link of links.values()) {
        if (parents.has(link.source) && parents.get(link.source) !== link.updated) throw new Error(`${link.source} has conflicting updated parents.`);
        parents.set(link.source, link.updated);
      }
      for (const source of parents.keys()) { const seen = new Set<string>(); let node: string | undefined = source;
        while (node && parents.has(node)) { if (seen.has(node)) throw new Error('Parent relationships contain a cycle.'); seen.add(node); node = parents.get(node); }
      }
    }
    const master = [...groups].flatMap(([name, group]) => {
      const sources = current.filter(o => oldParentTargets.get(o.id)?.has(group.id));
      const plans = Object.fromEntries(['Pipeline', 'TCV', 'Revenue'].map(type => {
        const field = `${type.toLowerCase()}RemedialActions` as 'pipelineRemedialActions';
        return [`${type} Remedial Actions`, sources.filter(o => o[field]).map(o => sources.length === 1 ? o[field] : `${o.name}: ${o[field]}`).join('\n')];
      }));
      return [{ 'Offering ID': group.id, 'Offering Name': name, Owner: current.find(o => o.id === group.id)?.leadOwner || group.rows[0].Owner, Quarter: quarter, ...plans }, ...group.rows];
    });
    const normalized = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(normalized, XLSX.utils.json_to_sheet(master), 'Offerings & Sub-Offerings');
    const migrated = actions.map(action => {
      const link = action.subOfferingId ? links.get(action.subOfferingId) : undefined;
      const targets = oldParentTargets.get(action.offeringId);
      if (action.subOfferingId && !link) throw new Error(`Action ${action.id} belongs to a detail row outside this replacement. Expand the source scope.`);
      if (!action.subOfferingId && (!targets || targets.size !== 1)) throw new Error(`Action ${action.id} has no unambiguous parent in this mapping.`);
      const parent = link?.parent ?? [...targets!][0];
      const name = [...groups].find(([, group]) => group.id === parent)![0];
      return { ...action, offeringId: parent, offeringName: name, subOfferingName: link?.name || '' };
    });
    const result = parseExcelImport(XLSX.write(normalized, { type: 'array', bookType: 'xlsx' }), [], migrated, quarter);
    if (result.error) return result;
    for (const offering of result.offerings) for (const [index, sub] of offering.subOfferings.entries()) {
      const link = links.get(sub.id)!;
      sub.mapping = { relationship, sourceOffering: link.source, sourceSubOffering: link.sub, updatedOffering: link.updated, sourceSheet: link.sheet, sourceRow: link.row };
      const prior = current.flatMap(o => o.subOfferings).find(s => s.id === sub.id);
      if (prior) {
        const retained = { ...sub, regionalBreakdown: structuredClone(prior.regionalBreakdown), winRate: prior.winRate, dealCount: prior.dealCount, avgDealSize: prior.avgDealSize, historicalGrowthYoY: prior.historicalGrowthYoY };
        offering.subOfferings[index] = metricFields.reduce((next, field) => setSubTotal(next, field, sub[field]), retained);
      }
    }
    return result;
  } catch (error) { return { offerings: [], actions: [], error: error instanceof Error ? error.message : 'Unable to validate mapping.' }; }
}
