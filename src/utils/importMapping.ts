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
export interface SheetInfo { name: string; rowCount: number; headers: string[]; sample: string[][] }
const value = (v: unknown) => String(v ?? '').trim();
export function inspectWorkbook(data: ArrayBuffer, headerRow = 1): SheetInfo[] {
  const wb = XLSX.read(data, { type: 'array' });
  return wb.SheetNames.map(name => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: '', blankrows: true });
    return { name, rowCount: rows.length, headers: (rows[headerRow - 1] || []).map(value), sample: rows.slice(headerRow, headerRow + 3).map(row => row.map(value)) };
  });
}

export function reviewMapping(data: ArrayBuffer, options: MappingOptions, current: Offering[], actions: RemedialAction[], quarter: QuarterType): ImportResult {
  if (options.mode === 'template') return parseExcelImport(data, current, actions, quarter);
  try {
    const wb = XLSX.read(data, { type: 'array' });
    if (!wb.Sheets[options.sheet]) throw new Error('Select a worksheet.');
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[options.sheet], { header: 1, defval: '', blankrows: true });
    const { headerRow, startRow, endRow, columns, relationship } = options;
    const grouping = relationship === 'parent-child' ? 'offering' : options.grouping;
    if (![headerRow, startRow, endRow].every(Number.isInteger) || headerRow < 1 || startRow <= headerRow || endRow < startRow || endRow > rows.length) throw new Error('Source rows must be after the header and within the worksheet.');
    const headers = (rows[headerRow - 1] || []).map(value);
    const required = ['Offering', 'Updated Offering', ...mappingFields.slice(4, 10), ...(grouping === 'sub-offering' ? ['Sub-offering'] : [])];
    for (const field of required) if (!columns[field]) throw new Error(`Map ${field}.`);
    const selected = Object.values(columns).filter(Boolean);
    if (new Set(selected).size !== selected.length) throw new Error('Map each source column only once.');
    for (const column of selected) if (headers.filter(h => h === column).length !== 1) throw new Error(`Column ${column} is missing or has duplicate headers.`);
    const get = (row: unknown[], field: string) => columns[field] ? row[headers.indexOf(columns[field])] : '';
    const groups = new Map<string, { id: number; rows: Record<string, unknown>[] }>();
    const links = new Map<string, { parent: number; name: string; source: string; updated: string; sub: string; row: number }>();
    const oldParentTargets = new Map<number, Set<number>>();
    let nextId = Math.max(0, ...current.map(o => o.id)) + 1;
    for (let n = startRow; n <= endRow; n++) {
      const row = rows[n - 1] || [];
      if (row.every(v => value(v) === '')) continue;
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
      const id = priorSub?.id || `mapped-${group.id}-${n}-${quarter.replace(/\s/g, '')}`;
      if (links.has(id) || group.rows.some(r => r['Sub offering Name'] === childName)) throw new Error(`Row ${n}: duplicate detail row ${childName}. Select a scope without repeated totals.`);
      if (prior) { const targets = oldParentTargets.get(prior.id) || new Set<number>(); targets.add(group.id); oldParentTargets.set(prior.id, targets); }
      links.set(id, { parent: group.id, name: childName, source, updated, sub, row: n });
      group.rows.push({ 'Offering ID': group.id, 'Sub-Offering ID': id, 'Sub offering Name': childName, Owner: columns.Owner ? get(row, 'Owner') : priorSub?.owner || '', Quarter: quarter,
        ...Object.fromEntries(mappingFields.slice(4).map(field => [field, get(row, field)])),
        ...Object.fromEntries(['Pipeline', 'TCV', 'Revenue'].filter(type => !columns[`${type} Remedial Actions`]).map(type => [`${type} Remedial Actions`, priorSub?.[`${type.toLowerCase()}RemedialActions` as 'pipelineRemedialActions'] || ''])) });
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
      sub.mapping = { relationship, sourceOffering: link.source, sourceSubOffering: link.sub, updatedOffering: link.updated, sourceSheet: options.sheet, sourceRow: link.row };
      const prior = current.flatMap(o => o.subOfferings).find(s => s.id === sub.id);
      if (prior) {
        const retained = { ...sub, regionalBreakdown: structuredClone(prior.regionalBreakdown), winRate: prior.winRate, dealCount: prior.dealCount, avgDealSize: prior.avgDealSize, historicalGrowthYoY: prior.historicalGrowthYoY };
        offering.subOfferings[index] = metricFields.reduce((next, field) => setSubTotal(next, field, sub[field]), retained);
      }
    }
    return result;
  } catch (error) { return { offerings: [], actions: [], error: error instanceof Error ? error.message : 'Unable to validate mapping.' }; }
}
