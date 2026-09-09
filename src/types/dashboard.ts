export type QuarterType = 'Q1 FY 27' | 'Q2 FY 27' | 'Q3 FY 27' | 'Q4 FY 27' | 'FY 27 Full Year';

export type RegionType = 'North America (NA)' | 'Europe (EMEA)' | 'Asia-Pacific (APAC)' | 'Latin America (LATAM)';

export type RemedialStatus = 'Open' | 'In Progress' | 'Under Review' | 'Completed' | 'Delayed';
export type RemedialPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ActionScope {
  offeringId: number;
  // Empty means an action for the entire offering.
  subOfferingId?: string;
}

export interface RegionalMetric {
  region: RegionType;
  pipelineAop: number;
  pipelineActual: number;
  tcvAop: number;
  tcvActual: number;
  revenueAop: number;
  revenueActual: number;
  activeOpportunities: number;
  topAccounts: string[];
}

export interface RemedialAction {
  id: string;
  type: 'Pipeline' | 'TCV' | 'Revenue';
  offeringId: number;
  subOfferingId: string;
  offeringName: string;
  subOfferingName: string;
  owner: string;
  title: string;
  description: string;
  rootCause: string;
  expectedImpact: number; // in $M or currency units
  targetQuarter: QuarterType;
  dueDate: string;
  priority: RemedialPriority;
  status: RemedialStatus;
  progressPercent: number;
  keyStakeholders: string[];
}

export interface SubOffering {
  id: string;
  no: number | string;
  name: string;
  owner: string;
  quarter: QuarterType;
  // Pipeline metrics
  pipelineAop: number;
  pipelineActual: number;
  pipelineGap: number; // actual - AOP
  pipelineAttainment: number; // percentage
  pipelineRemedialActions: string;
  // TCV metrics (TCV AOP = 2x Revenue AOP)
  tcvAop: number;
  tcvActual: number;
  tcvGap: number;
  tcvAttainment: number;
  tcvRemedialActions: string;
  // Revenue metrics
  revenueAop: number;
  revenueActual: number;
  revenueGap: number;
  revenueAttainment: number;
  revenueRemedialActions: string;
  // Detailed breakdown
  regionalBreakdown: Record<RegionType, RegionalMetric>;
  winRate: number; // percentage
  dealCount: number;
  avgDealSize: number;
  historicalGrowthYoY: number; // percentage
  status: 'Surplus' | 'On Track' | 'Moderate Gap' | 'Critical Gap';
  comments?: string;
}

export interface Offering {
  id: number;
  no: number;
  name: string;
  leadOwner: string;
  quarter: QuarterType;
  subOfferings: SubOffering[];
  // Pipeline Summary
  pipelineAop: number;
  pipelineActual: number;
  pipelineGap: number;
  pipelineAttainment: number;
  pipelineRemedialActions: string;
  // TCV Summary
  tcvAop: number;
  tcvActual: number;
  tcvGap: number;
  tcvAttainment: number;
  tcvRemedialActions: string;
  // Revenue Summary
  revenueAop: number;
  revenueActual: number;
  revenueGap: number;
  revenueAttainment: number;
  revenueRemedialActions: string;
  status: 'Surplus' | 'On Track' | 'Moderate Gap' | 'Critical Gap';
}

export interface OwnerPerformance {
  ownerName: string;
  leadOfferings: string[];
  subOfferings: string[];
  totalPipelineAop: number;
  totalPipelineActual: number;
  pipelineGap: number;
  pipelineAttainment: number;
  totalTcvAop: number;
  totalTcvActual: number;
  tcvGap: number;
  tcvAttainment: number;
  totalRevenueAop: number;
  totalRevenueActual: number;
  revenueGap: number;
  revenueAttainment: number;
  coverageRatio: number; // Pipeline : TCV
  tcvToRevenueCoverageRatio: number; // TCV : Revenue
  winRate: number;
  openActionsCount: number;
  resolvedActionsCount: number;
  status: 'Exceeding' | 'On Track' | 'At Risk' | 'Critical';
}

export interface FilterOptions {
  quarter: QuarterType;
  region: 'All Regions' | RegionType;
  offeringId: number | 'All';
  owner: string | 'All';
  searchQuery: string;
  statusFilter: 'All' | 'Surplus' | 'On Track' | 'Moderate Gap' | 'Critical Gap';
  unit: 'M' | 'INR_Cr'; // Millions ($M) or INR Crores (₹ Cr)
}
