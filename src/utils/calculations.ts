import { Offering, SubOffering, OwnerPerformance, FilterOptions, RemedialAction, RegionType } from '../types/dashboard';
import * as XLSX from 'xlsx';

export function calculateOfferingRollup(subOfferings: SubOffering[]): {
  pipelineAop: number;
  pipelineActual: number;
  pipelineGap: number;
  pipelineAttainment: number;
  tcvAop: number;
  tcvActual: number;
  tcvGap: number;
  tcvAttainment: number;
  revenueAop: number;
  revenueActual: number;
  revenueGap: number;
  revenueAttainment: number;
  status: 'Surplus' | 'On Track' | 'Moderate Gap' | 'Critical Gap';
} {
  const pipelineAop = subOfferings.reduce((sum, s) => sum + s.pipelineAop, 0);
  const pipelineActual = subOfferings.reduce((sum, s) => sum + s.pipelineActual, 0);
  const pipelineGap = Number((pipelineActual - pipelineAop).toFixed(2));
  const pipelineAttainment = pipelineAop > 0 ? Number(((pipelineActual / pipelineAop) * 100).toFixed(1)) : 100;

  const tcvAop = subOfferings.reduce((sum, s) => sum + s.tcvAop, 0);
  const tcvActual = subOfferings.reduce((sum, s) => sum + s.tcvActual, 0);
  const tcvGap = Number((tcvActual - tcvAop).toFixed(2));
  const tcvAttainment = tcvAop > 0 ? Number(((tcvActual / tcvAop) * 100).toFixed(1)) : 100;

  const revenueAop = subOfferings.reduce((sum, s) => sum + (s.revenueAop ?? 0), 0);
  const revenueActual = subOfferings.reduce((sum, s) => sum + (s.revenueActual ?? 0), 0);
  const revenueGap = Number((revenueActual - revenueAop).toFixed(2));
  const revenueAttainment = revenueAop > 0 ? Number(((revenueActual / revenueAop) * 100).toFixed(1)) : 100;

  let status: 'Surplus' | 'On Track' | 'Moderate Gap' | 'Critical Gap' = 'On Track';
  const minAttainment = Math.min(pipelineAttainment, tcvAttainment, revenueAttainment);
  if (minAttainment >= 100) status = 'Surplus';
  else if (minAttainment >= 90) status = 'On Track';
  else if (minAttainment >= 75) status = 'Moderate Gap';
  else status = 'Critical Gap';

  return {
    pipelineAop: Number(pipelineAop.toFixed(2)),
    pipelineActual: Number(pipelineActual.toFixed(2)),
    pipelineGap,
    pipelineAttainment,
    tcvAop: Number(tcvAop.toFixed(2)),
    tcvActual: Number(tcvActual.toFixed(2)),
    tcvGap,
    tcvAttainment,
    revenueAop: Number(revenueAop.toFixed(2)),
    revenueActual: Number(revenueActual.toFixed(2)),
    revenueGap,
    revenueAttainment,
    status
  };
}

export const USD_TO_INR_CR = 8.35; // 1 USD Million = ~8.35 INR Crores

export function formatCurrency(amount: number, unit: 'M' | 'INR_Cr' = 'M', includeSign: boolean = false): string {
  const isINR = unit === 'INR_Cr';
  const val = isINR ? amount * USD_TO_INR_CR : amount;
  const absVal = Math.round((Math.abs(val) + Number.EPSILON * Math.max(1, Math.abs(val))) * 100) / 100;
  const prefix = isINR ? '₹' : '$';
  const suffix = isINR ? ' Cr' : 'M';

  let formatted = `${prefix}${absVal.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}${suffix}`;

  if (amount < 0 || val < 0) {
    formatted = `-${formatted}`;
  } else if (includeSign && (amount > 0 || val > 0)) {
    formatted = `+${formatted}`;
  }
  return formatted;
}

export function formatPercent(val: number): string {
  return `${val.toFixed(1)}%`;
}

export function stripBrackets(text: string): string {
  if (!text) return '';
  return text.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
}

export function wrapTextIntoLines(text: string, maxCharsPerLine = 12, maxLines = 4): string[] {
  if (!text) return [];
  if (text.includes('\n')) return text.split('\n');

  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  // Curated clean multiline breaks for solution offering pillars to prevent any horizontal overlap
  if (lower === 'digital thread enablement services' || lower === 'offering 1: digital thread enablement services') {
    return ['Digital Thread', 'Enablement', 'Services'];
  }
  if (lower === 'application lifecycle management services' || lower === 'offering 2: application lifecycle management services') {
    return ['Application', 'Lifecycle', 'Management', 'Services'];
  }
  if (lower === 'cognitive digital thread services' || lower === 'offering 3: cognitive digital thread services') {
    return ['Cognitive', 'Digital Thread', 'Services'];
  }
  if (lower === 'product data services' || lower === 'offering 4: product data services') {
    return ['Product Data', 'Services'];
  }
  if (lower === 'enterprise devops & qa automation') {
    return ['Enterprise DevOps', '& QA Automation'];
  }
  if (lower === 'legacy modernization & integration') {
    return ['Legacy Modernization', '& Integration'];
  }
  if (lower === 'model based systems engineering') {
    return ['Model Based', 'Systems Eng.'];
  }
  if (lower === 'service lifecycle management') {
    return ['Service Lifecycle', 'Management'];
  }
  if (lower === 'design for sustainability') {
    return ['Design for', 'Sustainability'];
  }
  if (lower === 'cad/bom data transformation') {
    return ['CAD/BOM Data', 'Transformation'];
  }
  if (lower === 'engineering analytics & intelligence') {
    return ['Engineering Analytics', '& Intelligence'];
  }
  if (lower === 'cloud native services') {
    return ['Cloud Native', 'Services'];
  }
  if (lower === 'low code no code services') {
    return ['Low Code / No Code', 'Services'];
  }
  if (lower === 'agentic ai services') {
    return ['Agentic AI', 'Services'];
  }

  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines - 1);
    trimmed.push(lines.slice(maxLines - 1).join(' '));
    return trimmed;
  }

  return lines;
}

export function getStatusBadgeConfig(status: string) {
  switch (status) {
    case 'Surplus':
    case 'Exceeding':
    case 'Completed':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Surplus / Target Exceeded'
      };
    case 'On Track':
    case 'In Progress':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        label: 'On Track (90%+)'
      };
    case 'Moderate Gap':
    case 'Under Review':
    case 'At Risk':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Moderate Gap (75-89%)'
      };
    case 'Critical Gap':
    case 'Critical':
    case 'Delayed':
    default:
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Critical Gap (<75%)'
      };
  }
}

export function calculateExecutiveKPIs(offerings: Offering[], selectedRegion?: RegionType | 'All Regions') {
  let totalPipelineAop = 0;
  let totalPipelineActual = 0;
  let totalTcvAop = 0;
  let totalTcvActual = 0;
  let totalRevenueAop = 0;
  let totalRevenueActual = 0;
  let totalDeals = 0;
  let weightedWinRateSum = 0;

  offerings.forEach(off => {
    off.subOfferings.forEach(sub => {
      if (selectedRegion && selectedRegion !== 'All Regions') {
        const reg = sub.regionalBreakdown[selectedRegion];
        if (reg) {
          totalPipelineAop += reg.pipelineAop;
          totalPipelineActual += reg.pipelineActual;
          totalTcvAop += reg.tcvAop;
          totalTcvActual += reg.tcvActual;
          totalRevenueAop += reg.revenueAop ?? (reg.tcvAop / 2);
          totalRevenueActual += reg.revenueActual ?? (reg.tcvActual / 2);
          totalDeals += reg.activeOpportunities;
          weightedWinRateSum += sub.winRate * reg.activeOpportunities;
        }
      } else {
        totalPipelineAop += sub.pipelineAop;
        totalPipelineActual += sub.pipelineActual;
        totalTcvAop += sub.tcvAop;
        totalTcvActual += sub.tcvActual;
        totalRevenueAop += sub.revenueAop ?? (sub.tcvAop / 2);
        totalRevenueActual += sub.revenueActual ?? (sub.tcvActual / 2);
        totalDeals += sub.dealCount;
        weightedWinRateSum += sub.winRate * sub.dealCount;
      }
    });
  });

  const pipelineGap = Number((totalPipelineActual - totalPipelineAop).toFixed(2));
  const pipelineAttainment = totalPipelineAop > 0 ? Number(((totalPipelineActual / totalPipelineAop) * 100).toFixed(1)) : 100;

  const tcvGap = Number((totalTcvActual - totalTcvAop).toFixed(2));
  const tcvAttainment = totalTcvAop > 0 ? Number(((totalTcvActual / totalTcvAop) * 100).toFixed(1)) : 100;

  const revenueGap = Number((totalRevenueActual - totalRevenueAop).toFixed(2));
  const revenueAttainment = totalRevenueAop > 0 ? Number(((totalRevenueActual / totalRevenueAop) * 100).toFixed(1)) : 100;

  // Pipeline to TCV Coverage Ratio
  const coverageRatio = totalTcvActual > 0 ? Number((totalPipelineActual / totalTcvActual).toFixed(2)) : 0;
  // TCV to Revenue Coverage Ratio (Target is 2.0x since TCV AOP is double Revenue AOP)
  const tcvToRevenueCoverage = totalRevenueActual > 0 ? Number((totalTcvActual / totalRevenueActual).toFixed(2)) : 2.0;
  // Pipeline to Revenue Factor (Governance target benchmark: Revenue is 8x pipeline or 8.0x factor)
  const pipelineToRevenueFactor = totalRevenueActual > 0 ? Number((totalPipelineActual / totalRevenueActual).toFixed(2)) : 0;
  const revenueToPipelineFactor = totalPipelineActual > 0 ? Number((totalRevenueActual / totalPipelineActual).toFixed(2)) : 0;
  const avgWinRate = totalDeals > 0 ? Number((weightedWinRateSum / totalDeals).toFixed(1)) : 37.5;

  return {
    totalPipelineAop: Number(totalPipelineAop.toFixed(2)),
    totalPipelineActual: Number(totalPipelineActual.toFixed(2)),
    pipelineGap,
    pipelineAttainment,
    totalTcvAop: Number(totalTcvAop.toFixed(2)),
    totalTcvActual: Number(totalTcvActual.toFixed(2)),
    tcvGap,
    tcvAttainment,
    totalRevenueAop: Number(totalRevenueAop.toFixed(2)),
    totalRevenueActual: Number(totalRevenueActual.toFixed(2)),
    revenueGap,
    revenueAttainment,
    coverageRatio,
    tcvToRevenueCoverage,
    pipelineToRevenueFactor,
    revenueToPipelineFactor,
    totalDeals,
    avgWinRate
  };
}

export function calculateOwnerPerformances(offerings: Offering[], actions: RemedialAction[]): OwnerPerformance[] {
  const ownerMap: Record<string, {
    ownerName: string;
    leadOfferings: Set<string>;
    subOfferings: Set<string>;
    totalPipelineAop: number;
    totalPipelineActual: number;
    totalTcvAop: number;
    totalTcvActual: number;
    totalRevenueAop: number;
    totalRevenueActual: number;
    totalDeals: number;
    winRateAccumulator: number;
  }> = {};

  offerings.forEach(off => {
    // Add lead owner if designated
    if (off.leadOwner) {
      if (!ownerMap[off.leadOwner]) {
        ownerMap[off.leadOwner] = {
          ownerName: off.leadOwner,
          leadOfferings: new Set([off.name]),
          subOfferings: new Set(),
          totalPipelineAop: 0,
          totalPipelineActual: 0,
          totalTcvAop: 0,
          totalTcvActual: 0,
          totalRevenueAop: 0,
          totalRevenueActual: 0,
          totalDeals: 0,
          winRateAccumulator: 0
        };
      } else {
        ownerMap[off.leadOwner].leadOfferings.add(off.name);
      }
    }

    off.subOfferings.forEach(sub => {
      const oName = sub.owner;
      if (!ownerMap[oName]) {
        ownerMap[oName] = {
          ownerName: oName,
          leadOfferings: new Set(),
          subOfferings: new Set([sub.name]),
          totalPipelineAop: sub.pipelineAop,
          totalPipelineActual: sub.pipelineActual,
          totalTcvAop: sub.tcvAop,
          totalTcvActual: sub.tcvActual,
          totalRevenueAop: sub.revenueAop ?? (sub.tcvAop / 2),
          totalRevenueActual: sub.revenueActual ?? (sub.tcvActual / 2),
          totalDeals: sub.dealCount,
          winRateAccumulator: sub.winRate * sub.dealCount
        };
      } else {
        ownerMap[oName].subOfferings.add(sub.name);
        ownerMap[oName].totalPipelineAop += sub.pipelineAop;
        ownerMap[oName].totalPipelineActual += sub.pipelineActual;
        ownerMap[oName].totalTcvAop += sub.tcvAop;
        ownerMap[oName].totalTcvActual += sub.tcvActual;
        ownerMap[oName].totalRevenueAop += sub.revenueAop ?? (sub.tcvAop / 2);
        ownerMap[oName].totalRevenueActual += sub.revenueActual ?? (sub.tcvActual / 2);
        ownerMap[oName].totalDeals += sub.dealCount;
        ownerMap[oName].winRateAccumulator += sub.winRate * sub.dealCount;
      }
    });
  });

  return Object.values(ownerMap).map(o => {
    const pipelineGap = Number((o.totalPipelineActual - o.totalPipelineAop).toFixed(2));
    const pipelineAttainment = o.totalPipelineAop > 0 ? Number(((o.totalPipelineActual / o.totalPipelineAop) * 100).toFixed(1)) : 100;
    const tcvGap = Number((o.totalTcvActual - o.totalTcvAop).toFixed(2));
    const tcvAttainment = o.totalTcvAop > 0 ? Number(((o.totalTcvActual / o.totalTcvAop) * 100).toFixed(1)) : 100;
    const revenueGap = Number((o.totalRevenueActual - o.totalRevenueAop).toFixed(2));
    const revenueAttainment = o.totalRevenueAop > 0 ? Number(((o.totalRevenueActual / o.totalRevenueAop) * 100).toFixed(1)) : 100;

    const coverageRatio = o.totalTcvActual > 0 ? Number((o.totalPipelineActual / o.totalTcvActual).toFixed(2)) : 0;
    const tcvToRevenueCoverageRatio = o.totalRevenueActual > 0 ? Number((o.totalTcvActual / o.totalRevenueActual).toFixed(2)) : 2.0;
    const winRate = o.totalDeals > 0 ? Number((o.winRateAccumulator / o.totalDeals).toFixed(1)) : 35;

    const ownerActions = actions.filter(a => a.owner.toLowerCase() === o.ownerName.toLowerCase());
    const openActionsCount = ownerActions.filter(a => a.status !== 'Completed').length;
    const resolvedActionsCount = ownerActions.filter(a => a.status === 'Completed').length;

    let status: 'Exceeding' | 'On Track' | 'At Risk' | 'Critical' = 'On Track';
    if (tcvAttainment >= 100 && revenueAttainment >= 100) status = 'Exceeding';
    else if (tcvAttainment >= 90 && revenueAttainment >= 90) status = 'On Track';
    else if (tcvAttainment >= 75 || revenueAttainment >= 75) status = 'At Risk';
    else status = 'Critical';

    return {
      ownerName: o.ownerName,
      leadOfferings: Array.from(o.leadOfferings),
      subOfferings: Array.from(o.subOfferings),
      totalPipelineAop: Number(o.totalPipelineAop.toFixed(2)),
      totalPipelineActual: Number(o.totalPipelineActual.toFixed(2)),
      pipelineGap,
      pipelineAttainment,
      totalTcvAop: Number(o.totalTcvAop.toFixed(2)),
      totalTcvActual: Number(o.totalTcvActual.toFixed(2)),
      tcvGap,
      tcvAttainment,
      totalRevenueAop: Number(o.totalRevenueAop.toFixed(2)),
      totalRevenueActual: Number(o.totalRevenueActual.toFixed(2)),
      revenueGap,
      revenueAttainment,
      coverageRatio,
      tcvToRevenueCoverageRatio,
      winRate,
      openActionsCount,
      resolvedActionsCount,
      status
    };
  }).sort((a, b) => b.totalTcvAop - a.totalTcvAop);
}

export function buildWorkbook(offerings: Offering[], actions: RemedialAction[]) {
  // 1. Sheet 1: Master Summary (Exact format matching user's template)
  const masterRows: any[] = [];

  offerings.forEach(off => {
    // Offering Row
    masterRows.push({
      'Offering ID': off.id,
      'Sub-Offering ID': '',
      'No': off.no,
      'Offering Name': off.name,
      'Sub offering Name': '',
      'Owner': off.leadOwner,
      'Quarter': off.quarter,
      'Pipeline AOP ($M)': off.pipelineAop,
      'Pipeline Actual ($M)': off.pipelineActual,
      'Pipeline Gap ($M)': off.pipelineGap,
      'Pipeline Remedial Actions': off.pipelineRemedialActions,
      'TCV AOP ($M)': off.tcvAop,
      'TCV Actual ($M)': off.tcvActual,
      'TCV Gap ($M)': off.tcvGap,
      'TCV Remedial Actions': off.tcvRemedialActions,
      'Revenue AOP ($M)': off.revenueAop,
      'Revenue Actual ($M)': off.revenueActual,
      'Revenue Gap ($M)': off.revenueGap,
      'Revenue Remedial Actions': off.revenueRemedialActions
    });

    // Sub Offering Rows
    off.subOfferings.forEach(sub => {
      masterRows.push({
        'Offering ID': off.id,
        'Sub-Offering ID': sub.id,
        'No': sub.no,
        'Win Rate': sub.winRate,
        'Deal Count': sub.dealCount,
        'Average Deal Size': sub.avgDealSize,
        'Offering Name': '',
        'Sub offering Name': sub.name,
        'Owner': sub.owner,
        'Quarter': sub.quarter,
        'Pipeline AOP ($M)': sub.pipelineAop,
        'Pipeline Actual ($M)': sub.pipelineActual,
        'Pipeline Gap ($M)': sub.pipelineGap,
        'Pipeline Remedial Actions': sub.pipelineRemedialActions,
        'TCV AOP ($M)': sub.tcvAop,
        'TCV Actual ($M)': sub.tcvActual,
        'TCV Gap ($M)': sub.tcvGap,
        'TCV Remedial Actions': sub.tcvRemedialActions,
        'Revenue AOP ($M)': sub.revenueAop,
        'Revenue Actual ($M)': sub.revenueActual,
        'Revenue Gap ($M)': sub.revenueGap,
        'Revenue Remedial Actions': sub.revenueRemedialActions
      });
    });

    // Spacer row
    masterRows.push({});
  });

  const ws1 = XLSX.utils.json_to_sheet(masterRows);

  // 2. Sheet 2: Remedial Actions Registry
  const actionRows = actions.map(a => ({
    'Action ID': a.id,
    'Offering ID': a.offeringId,
    'Sub-Offering ID': a.subOfferingId,
    'Type': a.type,
    'Offering': a.offeringName,
    'Sub-Offering': a.subOfferingName,
    'Owner': a.owner,
    'Action Title': a.title,
    'Root Cause': a.rootCause,
    'Remedial Action Details': a.description,
    'Expected Impact ($M)': a.expectedImpact,
    'Target Quarter': a.targetQuarter,
    'Due Date': a.dueDate,
    'Priority': a.priority,
    'Status': a.status,
    'Progress %': `${a.progressPercent}%`,
    'Key Stakeholders': a.keyStakeholders.join(', ')
  }));
  const ws2 = XLSX.utils.json_to_sheet(actionRows, { header: ['Action ID', 'Offering ID', 'Sub-Offering ID', 'Type', 'Offering', 'Sub-Offering', 'Owner', 'Action Title', 'Root Cause', 'Remedial Action Details', 'Expected Impact ($M)', 'Target Quarter', 'Due Date', 'Priority', 'Status', 'Progress %', 'Key Stakeholders'] });

  // 3. Sheet 3: Regional Breakdown Matrix
  const regionalRows: any[] = [];
  offerings.forEach(off => {
    off.subOfferings.forEach(sub => {
      Object.entries(sub.regionalBreakdown).forEach(([regName, regData]) => {
        regionalRows.push({
          'Offering ID': off.id,
          'Sub-Offering ID': sub.id,
          'Offering': off.name,
          'Sub-Offering': sub.name,
          'Owner': sub.owner,
          'Region': regName,
          'Pipeline AOP ($M)': regData.pipelineAop,
          'Pipeline Actual ($M)': regData.pipelineActual,
          'Pipeline Gap ($M)': Number((regData.pipelineActual - regData.pipelineAop).toFixed(2)),
          'TCV AOP ($M)': regData.tcvAop,
          'TCV Actual ($M)': regData.tcvActual,
          'TCV Gap ($M)': Number((regData.tcvActual - regData.tcvAop).toFixed(2)),
          'Revenue AOP ($M)': regData.revenueAop,
          'Revenue Actual ($M)': regData.revenueActual,
          'Revenue Gap ($M)': Number(((regData.revenueActual ?? 0) - (regData.revenueAop ?? 0)).toFixed(2)),
          'Active Opportunities': regData.activeOpportunities,
          'Key Target Accounts': regData.topAccounts.join(', ')
        });
      });
    });
  });
  const ws3 = XLSX.utils.json_to_sheet(regionalRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Offerings & Sub-Offerings');
  XLSX.utils.book_append_sheet(wb, ws2, 'Remedial Actions');
  XLSX.utils.book_append_sheet(wb, ws3, 'Regional Breakdown');

  return wb;
}

export function exportToExcel(offerings: Offering[], actions: RemedialAction[]) {
  XLSX.writeFile(buildWorkbook(offerings, actions), `Solution_Offerings_Pipeline_TCV_Revenue_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export { parseExcelImport } from './excelImport';
