import { FilterOptions, Offering, RemedialAction } from '../types/dashboard';
import { calculateExecutiveKPIs, formatCurrency } from './calculations';

export function priorityActions(actions: RemedialAction[]): RemedialAction[] {
  const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return actions.filter(a => a.status !== 'Completed').sort((a, b) =>
    rank[a.priority] - rank[b.priority] || a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id)
  ).slice(0, 6);
}

export function buildExecutiveSummary(offerings: Offering[], actions: RemedialAction[], filters: FilterOptions, date = new Date()): string {
  const kpis = calculateExecutiveKPIs(offerings);
  const amount = (value: number) => formatCurrency(value, filters.unit);
  const initiatives = priorityActions(actions);
  const lines = [
    'DIGITAL THREAD SOLUTIONS — EXECUTIVE BRIEF',
    `Quarter: ${filters.quarter}`,
    `Scope: Full quarter — all offerings and regions`,
    `Currency: ${filters.unit === 'INR_Cr' ? 'INR (₹ Cr)' : 'USD ($M)'}`,
    `Generated: ${date.toISOString().slice(0, 10)}`,
    '', 'EXECUTIVE KPI SUMMARY',
    `Pipeline: ${amount(kpis.totalPipelineActual)} actual / ${amount(kpis.totalPipelineAop)} planned; gap ${amount(kpis.pipelineGap)}; attainment ${kpis.pipelineAttainment}%`,
    `TCV: ${amount(kpis.totalTcvActual)} actual / ${amount(kpis.totalTcvAop)} planned; gap ${amount(kpis.tcvGap)}; attainment ${kpis.tcvAttainment}%`,
    `Revenue: ${amount(kpis.totalRevenueActual)} actual / ${amount(kpis.totalRevenueAop)} planned; gap ${amount(kpis.revenueGap)}; attainment ${kpis.revenueAttainment}%`,
    '', 'OFFERING PERFORMANCE',
    ...offerings.flatMap(o => [`${o.no}. ${o.name} — Lead: ${o.leadOwner}`,
      `  Pipeline gap: ${amount(o.pipelineGap)}; TCV gap: ${amount(o.tcvGap)}; Revenue gap: ${amount(o.revenueGap)}`]),
    '', `PRIORITY OPEN INITIATIVES (${initiatives.length} of ${actions.filter(a => a.status !== 'Completed').length} open actions)`,
    ...initiatives.flatMap(a => [
      `${a.offeringName} > ${a.subOfferingName || 'Entire offering'}`,
      `  [${a.type}] [${a.priority}] ${a.title}`,
      `  Root cause: ${a.rootCause}`,
      `  Plan: ${a.description}`,
      `  Owner: ${a.owner}; Due: ${a.dueDate}; Status: ${a.status}; Progress: ${a.progressPercent}%; Expected lift: ${amount(a.expectedImpact)}`,
    ]),
  ];
  if (!initiatives.length) lines.push('No open initiatives.');
  return lines.join('\n');
}
