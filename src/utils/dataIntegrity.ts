import { ActionScope, FilterOptions, Offering, RemedialAction, SubOffering } from '../types/dashboard';

export const metricFields = ['pipelineAop', 'pipelineActual', 'tcvAop', 'tcvActual', 'revenueAop', 'revenueActual'] as const;
export type MetricField = typeof metricFields[number];
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function recalculateSub(sub: SubOffering): SubOffering {
  const result = { ...sub };
  for (const field of metricFields) {
    if (!Number.isFinite(result[field]) || result[field] < 0) throw new Error(`${field} must be a non-negative number.`);
    result[field] = round(result[field]);
  }
  for (const metric of ['pipeline', 'tcv', 'revenue'] as const) {
    result[`${metric}Gap`] = round(result[`${metric}Actual`] - result[`${metric}Aop`]);
    result[`${metric}Attainment`] = result[`${metric}Aop`] > 0
      ? Math.round(result[`${metric}Actual`] / result[`${metric}Aop`] * 1000) / 10 : 100;
  }
  const minimum = Math.min(result.pipelineAttainment, result.tcvAttainment, result.revenueAttainment);
  result.status = minimum >= 100 ? 'Surplus' : minimum >= 90 ? 'On Track' : minimum >= 75 ? 'Moderate Gap' : 'Critical Gap';
  return result;
}

// Preserve the existing regional proportions when a total is edited. Allocate
// integer cents so that the regions always sum exactly to the new total.
export function setSubTotal(sub: SubOffering, field: MetricField, value: number): SubOffering {
  if (!Number.isFinite(value) || value < 0) throw new Error('Amounts must be non-negative numbers.');
  const entries = Object.entries(sub.regionalBreakdown);
  const sum = entries.reduce((n, [, region]) => n + region[field], 0);
  const cents = Math.round(value * 100);
  let allocated = 0;
  let cumulative = 0;
  const regionalBreakdown = Object.fromEntries(entries.map(([name, region], index) => {
    cumulative += sum > 0 ? region[field] / sum : 1 / entries.length;
    const next = index === entries.length - 1 ? cents : Math.round(cents * cumulative);
    const amount = (next - allocated) / 100;
    allocated = next;
    return [name, { ...region, [field]: amount }];
  })) as SubOffering['regionalBreakdown'];
  return recalculateSub({ ...sub, [field]: cents / 100, regionalBreakdown });
}

export function sumSubRegions(sub: SubOffering): SubOffering {
  const totals = Object.fromEntries(metricFields.map(field => [field,
    round(Object.values(sub.regionalBreakdown).reduce((sum, region) => sum + region[field], 0))
  ]));
  return recalculateSub({ ...sub, ...totals });
}

export function resolveAction(action: RemedialAction, offerings: Offering[]): RemedialAction {
  const offering = offerings.find(o => o.id === action.offeringId);
  const sub = offering?.subOfferings.find(s => s.id === action.subOfferingId);
  if (!offering || (action.subOfferingId && !sub)) throw new Error('Select a sub-offering that belongs to the selected offering.');
  if (action.targetQuarter !== offering.quarter) throw new Error('The action quarter must match its offering.');
  return { ...action, offeringName: offering.name, subOfferingName: sub?.name || '',
    progressPercent: action.status === 'Completed' ? 100 : Math.min(100, Math.max(0, action.progressPercent)) };
}

export function initialActionScope(offerings: Offering[], scope?: ActionScope, owner?: string): ActionScope | undefined {
  if (scope) {
    const offering = offerings.find(o => o.id === scope.offeringId);
    if (offering && (!scope.subOfferingId || offering.subOfferings.some(s => s.id === scope.subOfferingId))) return scope;
  }
  const offering = offerings.find(o => o.subOfferings.some(s => s.owner === owner) || o.leadOwner === owner) || offerings[0];
  if (!offering) return undefined;
  return { offeringId: offering.id, subOfferingId: offering.subOfferings.find(s => s.owner === owner)?.id || '' };
}

const normalize = (value: string) => value.replace(/\s*[([][^)\]]*[)\]]/g, '').trim().toLowerCase();
export function matchesSubFilters(off: Offering, sub: SubOffering, filters: FilterOptions): boolean {
  if (filters.offeringId !== 'All' && off.id !== filters.offeringId) return false;
  const owner = normalize(filters.owner);
  if (filters.owner !== 'All' && normalize(sub.owner) !== owner &&
      !(normalize(off.leadOwner) === owner && !off.subOfferings.some(s => normalize(s.owner) === owner))) return false;
  if (filters.statusFilter !== 'All' && sub.status !== filters.statusFilter) return false;
  const query = filters.searchQuery.trim().toLowerCase();
  return !query || [off.name, off.leadOwner, sub.name, sub.owner, sub.pipelineRemedialActions, sub.tcvRemedialActions, sub.revenueRemedialActions]
    .some(value => value?.toLowerCase().includes(query));
}
