import * as XLSX from 'xlsx';
import { Offering, QuarterType, RemedialAction, SubOffering } from '../types/dashboard';
import { QUARTERS_LIST, REGIONS } from '../data/initialData';
import { calculateOfferingRollup } from './calculations';
import { metricFields, recalculateSub, resolveAction, setSubTotal, sumSubRegions } from './dataIntegrity';

type Row = Record<string, any>;
const text = (value: unknown) => String(value ?? '').trim();
const metricHeaders = ['Pipeline AOP ($M)', 'Pipeline Actual ($M)', 'TCV AOP ($M)', 'TCV Actual ($M)', 'Revenue AOP ($M)', 'Revenue Actual ($M)'];
function number(value: unknown, label: string, fallback?: number): number {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing ${label}.`);
  }
  const result = typeof value === 'number' ? value : Number(text(value).replace(/,/g, ''));
  if (!Number.isFinite(result) || result < 0) throw new Error(`${label} must be a non-negative number.`);
  return result;
}
function rows(sheet: XLSX.WorkSheet): Row[] {
  const raw = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  const header = raw.findIndex(row => row.some(cell => ['Offering Name', 'Action ID', 'Region'].includes(text(cell))));
  if (header < 0) throw new Error('Could not detect the exported template headers.');
  return XLSX.utils.sheet_to_json<Row>(sheet, { range: header, defval: '' });
}

export interface ImportResult { offerings: Offering[]; actions: RemedialAction[]; quarter?: QuarterType; error?: string; }

// Import is transactional: no rows are applied unless all sheets and links validate.
export function parseExcelImport(fileData: ArrayBuffer, current: Offering[] = [], existingActions: RemedialAction[] = [], selectedQuarter: QuarterType = 'Q1 FY 27'): ImportResult {
  try {
    const wb = XLSX.read(fileData, { type: 'array' });
    const master = wb.Sheets['Offerings & Sub-Offerings'] || wb.Sheets[wb.SheetNames[0]];
    if (!master) throw new Error('The workbook has no worksheets.');
    const masterRows = rows(master);
    if (!masterRows.length) throw new Error('The template contains no data rows.');
    const offerings: Offering[] = [];
    const usedIds = new Set<number>();
    const subIds = new Set<string>();
    let parent: Offering | undefined;
    let quarter: QuarterType | undefined;
    for (const [index, row] of masterRows.entries()) {
      if (Object.values(row).every(v => text(v) === '')) continue;
      const name = text(row['Offering Name']);
      const subName = text(row['Sub offering Name']);
      const q = (text(row.Quarter) || selectedQuarter) as QuarterType;
      if (!QUARTERS_LIST.includes(q)) throw new Error(`Invalid quarter on master row ${index + 2}.`);
      if (quarter && quarter !== q) throw new Error('Import one quarter per workbook.');
      quarter = q;
      if (q !== selectedQuarter) throw new Error(`Select ${q} in the dashboard before importing this workbook.`);
      if (name && !subName) {
        const previous = current.find(o => text(row['Offering ID']) ? String(o.id) === text(row['Offering ID']) : o.name === name);
        const id = number(row['Offering ID'] || row.No, 'Offering ID / No', previous?.id ?? Math.max(0, ...current.map(o => o.id), ...usedIds) + 1);
        if (!Number.isInteger(id) || id <= 0 || usedIds.has(id) || offerings.some(o => o.name === name)) throw new Error(`Duplicate or invalid offering: ${name}.`);
        usedIds.add(id);
        parent = { ...previous, id, no: number(row.No, 'No', id), name, leadOwner: text(row.Owner), quarter: q, subOfferings: [],
          pipelineRemedialActions: text(row['Pipeline Remedial Actions']), tcvRemedialActions: text(row['TCV Remedial Actions']), revenueRemedialActions: text(row['Revenue Remedial Actions']),
          ...calculateOfferingRollup([]) };
        offerings.push(parent);
        continue;
      }
      if (!subName || !parent) throw new Error(`Master row ${index + 2} must follow its parent offering row.`);
      if ((name && name !== parent.name) || (text(row['Offering ID']) && Number(row['Offering ID']) !== parent.id)) throw new Error(`Parent mismatch for ${subName}.`);
      const previous = current.find(o => o.id === parent!.id)?.subOfferings.find(s => text(row['Sub-Offering ID']) ? s.id === text(row['Sub-Offering ID']) : s.name === subName);
      const id = text(row['Sub-Offering ID']) || previous?.id || `import-${parent.id}-${parent.subOfferings.length + 1}-${q.replace(/\s/g, '')}`;
      if (subIds.has(id) || parent.subOfferings.some(s => s.name === subName)) throw new Error(`Duplicate sub-offering: ${subName}.`);
      subIds.add(id);
      const regionalBreakdown = previous ? structuredClone(previous.regionalBreakdown) : Object.fromEntries(REGIONS.map(r => [r.name, {
        region: r.name, pipelineAop: 0, pipelineActual: 0, tcvAop: 0, tcvActual: 0, revenueAop: 0, revenueActual: 0, activeOpportunities: 0, topAccounts: []
      }])) as SubOffering['regionalBreakdown'];
      let sub: SubOffering = { ...previous, id, no: row.No || previous?.no || parent.subOfferings.length + 1, name: subName, owner: text(row.Owner), quarter: q,
        pipelineAop: 0, pipelineActual: 0, tcvAop: 0, tcvActual: 0, revenueAop: 0, revenueActual: 0,
        pipelineGap: 0, tcvGap: 0, revenueGap: 0, pipelineAttainment: 0, tcvAttainment: 0, revenueAttainment: 0, status: 'On Track',
        pipelineRemedialActions: text(row['Pipeline Remedial Actions']), tcvRemedialActions: text(row['TCV Remedial Actions']), revenueRemedialActions: text(row['Revenue Remedial Actions']),
        winRate: number(row['Win Rate'], 'Win Rate', previous?.winRate ?? 0), dealCount: number(row['Deal Count'], 'Deal Count', previous?.dealCount ?? 0),
        avgDealSize: number(row['Average Deal Size'], 'Average Deal Size', previous?.avgDealSize ?? 0), historicalGrowthYoY: previous?.historicalGrowthYoY ?? 0, regionalBreakdown };
      if (sub.winRate > 100 || !Number.isInteger(sub.dealCount)) throw new Error(`Invalid win rate or deal count for ${subName}.`);
      for (const [i, field] of metricFields.entries()) sub = setSubTotal(sub, field, number(row[metricHeaders[i]], `${subName}: ${metricHeaders[i]}`));
      parent.subOfferings.push(recalculateSub(sub));
    }
    if (!offerings.length || offerings.some(o => !o.subOfferings.length)) throw new Error('Each offering must have at least one sub-offering row.');

    function locate(row: Row): { offering: Offering; sub?: SubOffering } {
      const offering = offerings.find(o => text(row['Offering ID']) ? String(o.id) === text(row['Offering ID']) : o.name === text(row.Offering));
      if (!offering) throw new Error(`Unknown parent offering: ${text(row.Offering)}.`);
      if (text(row.Offering) && text(row.Offering) !== offering.name) throw new Error('Offering ID and name do not match.');
      const subName = text(row['Sub-Offering']);
      const subId = text(row['Sub-Offering ID']);
      const sub = offering.subOfferings.find(s => subId ? s.id === subId : s.name === subName);
      if ((subId || subName) && !sub) throw new Error(`Sub-offering ${subName || subId} does not belong to ${offering.name}.`);
      if (sub && subName && sub.name !== subName) throw new Error('Sub-offering ID and name do not match.');
      return { offering, sub };
    }

    if (wb.Sheets['Regional Breakdown']) {
      const seen = new Set<string>();
      for (const row of rows(wb.Sheets['Regional Breakdown'])) {
        const { sub } = locate(row);
        const region = REGIONS.find(r => r.name === text(row.Region))?.name;
        if (!sub || !region) throw new Error('Every regional row needs a valid parent, sub-offering and region.');
        const key = `${sub.id}:${region}`;
        if (seen.has(key)) throw new Error(`Duplicate regional row: ${key}.`);
        seen.add(key);
        const reg = sub.regionalBreakdown[region];
        for (const [i, field] of metricFields.entries()) reg[field] = number(row[metricHeaders[i]], `${key}: ${metricHeaders[i]}`);
        reg.activeOpportunities = number(row['Active Opportunities'], 'Active Opportunities', 0);
        if (!Number.isInteger(reg.activeOpportunities)) throw new Error('Active Opportunities must be a whole number.');
        reg.topAccounts = text(row['Key Target Accounts']).split(',').map(v => v.trim()).filter(Boolean);
      }
      for (const off of offerings) for (const sub of off.subOfferings) {
        if (REGIONS.some(r => !seen.has(`${sub.id}:${r.name}`))) throw new Error(`Missing regional rows for ${sub.name}.`);
        const totals = sumSubRegions(sub);
        if (metricFields.some(field => Math.abs(totals[field] - sub[field]) > 0.05)) throw new Error(`Regional totals do not match the master row for ${sub.name}. Update both sheets or remove the Regional Breakdown sheet to redistribute master totals.`);
        Object.assign(sub, totals);
      }
    }
    offerings.forEach(o => Object.assign(o, calculateOfferingRollup(o.subOfferings)));
    let actions = wb.Sheets['Remedial Actions'] ? [] : existingActions.map(a => resolveAction(a, offerings));
    if (wb.Sheets['Remedial Actions']) {
      actions = [];
      const seen = new Set<string>();
      const actionSheet = wb.Sheets['Remedial Actions'];
      const actionRows = actionSheet['!ref'] ? rows(actionSheet) : [];
      for (const row of actionRows) {
        const { offering, sub } = locate(row);
        const id = text(row['Action ID']);
        if (!id || seen.has(id)) throw new Error('Action IDs must be present and unique.');
        seen.add(id);
        const type = text(row.Type) as RemedialAction['type'];
        const status = text(row.Status) as RemedialAction['status'];
        const priority = text(row.Priority) as RemedialAction['priority'];
        if (!['Pipeline', 'TCV', 'Revenue'].includes(type) || !['Open', 'In Progress', 'Under Review', 'Completed', 'Delayed'].includes(status) || !['Critical', 'High', 'Medium', 'Low'].includes(priority)) throw new Error(`Invalid type, status or priority for action ${id}.`);
        let dueDate = text(row['Due Date']);
        if (typeof row['Due Date'] === 'number') { const d = XLSX.SSF.parse_date_code(row['Due Date']); dueDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate))) throw new Error(`Invalid due date for action ${id}.`);
        const progressPercent = number(text(row['Progress %']).replace('%', ''), 'Progress %', 0);
        if (progressPercent > 100) throw new Error('Progress must be between 0 and 100.');
        const action: RemedialAction = { id, type, offeringId: offering.id, offeringName: offering.name, subOfferingId: sub?.id || '', subOfferingName: sub?.name || '',
          owner: text(row.Owner), title: text(row['Action Title']), description: text(row['Remedial Action Details']), rootCause: text(row['Root Cause']),
          expectedImpact: number(row['Expected Impact ($M)'], 'Expected Impact'), targetQuarter: (text(row['Target Quarter']) || quarter) as QuarterType, dueDate, priority, status, progressPercent,
          keyStakeholders: text(row['Key Stakeholders']).split(',').map(v => v.trim()).filter(Boolean) };
        if (!action.title || !action.owner || !action.description || !action.rootCause) throw new Error(`Action ${id} needs a title, owner, root cause and plan details.`);
        actions.push(resolveAction(action, offerings));
      }
    }
    return { offerings, actions, quarter };
  } catch (error) {
    return { offerings: [], actions: [], error: error instanceof Error ? error.message : 'Failed to parse Excel file.' };
  }
}
