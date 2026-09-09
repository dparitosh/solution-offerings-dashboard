import { Offering, RemedialAction, QuarterType, RegionType, SubOffering } from '../types/dashboard';

import { metricFields, setSubTotal } from '../utils/dataIntegrity';

export const REGIONS: { id: string; name: RegionType; code: string; color: string; description: string }[] = [
  { id: 'na', name: 'North America (NA)', code: 'NA', color: '#2563eb', description: 'Primary revenue engine; strong Aerospace, Automotive & High-Tech demand.' },
  { id: 'emea', name: 'Europe (EMEA)', code: 'EMEA', color: '#0d9488', description: 'Heavy focus on Industrial Automation, Sustainability compliance & Life Sciences.' },
  { id: 'apac', name: 'Asia-Pacific (APAC)', code: 'APAC', color: '#8b5cf6', description: 'High-growth market in Electronics, Smart Factory & Cloud migration.' },
  { id: 'latam', name: 'Latin America (LATAM)', code: 'LATAM', color: '#f59e0b', description: 'Emerging territory with mining, aviation, and agribusiness automation pursuits.' },
];

export const QUARTERS_LIST: QuarterType[] = ['Q1 FY 27', 'Q2 FY 27', 'Q3 FY 27', 'Q4 FY 27', 'FY 27 Full Year'];

// Helper to create quarter-specific offerings
function generateQuarterOfferings(quarter: QuarterType): Offering[] {
  const multipliers: Record<QuarterType, { aopMult: number; actualMult: number; attainBoost: number }> = {
    'Q1 FY 27': { aopMult: 1.0, actualMult: 1.0, attainBoost: 0 },
    'Q2 FY 27': { aopMult: 1.15, actualMult: 1.20, attainBoost: 4 },
    'Q3 FY 27': { aopMult: 1.30, actualMult: 1.38, attainBoost: 7 },
    'Q4 FY 27': { aopMult: 1.50, actualMult: 1.65, attainBoost: 11 },
    'FY 27 Full Year': { aopMult: 4.95, actualMult: 5.23, attainBoost: 6 }
  };

  const m = multipliers[quarter] || multipliers['Q1 FY 27'];

  // Base raw template definitions
  const baseOfferings = [
    {
      id: 1,
      no: 1,
      name: 'Digital Thread Enablement Services',
      leadOwner: 'Rajesh D',
      pipelineRemedialActions: quarter === 'Q1 FY 27'
        ? 'Accelerate OEM Tier-1 co-marketing campaigns and partner joint-pitches with Siemens/PTC in NA & EMEA to inject $7M qualified pipeline.'
        : quarter === 'Q2 FY 27'
        ? 'Scale joint partner solution roadshows and expand defense contractor pre-sales teams.'
        : quarter === 'Q3 FY 27'
        ? 'Execute multi-region customer innovation summits with dedicated proof-of-value labs.'
        : quarter === 'Q4 FY 27'
        ? 'Drive year-end contract closures and multi-year program renewals across key global accounts.'
        : 'Comprehensive annual enablement delivery across Tier-1 OEM partnerships, defense programs, and smart manufacturing lines.',
      tcvRemedialActions: quarter === 'Q1 FY 27'
        ? 'Executive sponsorship alignment on 3 stalled Fortune 500 automotive deals; introduce flexible milestone packaging to unlock $2.5M in Q1.'
        : quarter === 'Q2 FY 27'
        ? 'Restructure milestone delivery models to unlock delayed enterprise procurement approvals.'
        : quarter === 'Q3 FY 27'
        ? 'Deploy VP-level executive deal clinics to unblock complex global licensing and services agreements.'
        : quarter === 'Q4 FY 27'
        ? 'Finalize enterprise master agreements with volume-based SLA protection tiers.'
        : 'Full year contract value optimization with tiered milestone governance and executive client co-sponsorship.',
      subs: [
        {
          id: '1-1',
          no: '1.1',
          name: 'Model Based Systems Engineering',
          owner: 'Bala',
          basePAop: 9.5,
          basePAct: 7.2,
          baseTAop: 3.1,
          baseTAct: 2.2,
          winRate: 34,
          dealCount: 14,
          avgDealSize: 0.51,
          growth: 18.5,
          pRem: 'Launch defense & aerospace targeted lead generation webinars; partner with SysML tooling providers for lead exchange.',
          tRem: 'Expedite DoD clearance sign-offs and structure multi-phase pilot contracts to accelerate deal closures.',
          rRem: 'Accelerate milestone acceptance testing with defense clients to recognize Q1 revenue ahead of schedule.',
          naAcc: ['Lockheed Martin Aero', 'Boeing Defense', 'General Dynamics'],
          emeaAcc: ['Airbus Defence', 'BAE Systems'],
          apacAcc: ['Mitsubishi Heavy Ind', 'Hanwha Aerospace'],
          latamAcc: ['Embraer Defense']
        },
        {
          id: '1-2',
          no: '1.2',
          name: 'Digital Manufacturing',
          owner: 'Kalpesh',
          basePAop: 11.0,
          basePAct: 10.1,
          baseTAop: 3.6,
          baseTAct: 3.4,
          winRate: 42,
          dealCount: 19,
          avgDealSize: 0.53,
          growth: 24.0,
          pRem: 'Focus on smart factory brownfield retrofit use cases in industrial equipment and heavy machinery sectors.',
          tRem: 'Finalize master service agreement terms with top 2 industrial automation accounts in Midwest NA.',
          rRem: 'Deploy onsite technical coordinators to speed client sign-off on plant commissioning milestones.',
          naAcc: ['Caterpillar Global', 'John Deere', 'Honeywell Plant'],
          emeaAcc: ['Siemens AG Factories', 'Schneider Electric'],
          apacAcc: ['Toyota Motor Manuf.', 'Komatsu'],
          latamAcc: ['Ternium Steel Plant']
        },
        {
          id: '1-3',
          no: '1.3',
          name: 'Service Lifecycle Management',
          owner: 'Srikanth',
          basePAop: 8.0,
          basePAct: 5.9,
          baseTAop: 2.6,
          baseTAct: 1.8,
          winRate: 29,
          dealCount: 11,
          avgDealSize: 0.54,
          growth: 12.0,
          pRem: 'Re-engage installed base clients for field service automation and connected warranty analytics offerings.',
          tRem: 'Conduct executive value-realization workshops to demonstrate ROI on spare parts inventory optimization.',
          rRem: 'Re-align staffing to unblock delayed software delivery sprints for Carrier and Otis.',
          naAcc: ['Carrier HVAC Corp', 'Otis Elevator Global'],
          emeaAcc: ['ABB Service Group', 'KONE Corp'],
          apacAcc: ['Hitachi Plant Tech'],
          latamAcc: ['WEG Electric Equipment']
        },
        {
          id: '1-4',
          no: '1.4',
          name: 'Design for Sustainability',
          owner: 'Ravi',
          basePAop: 6.0,
          basePAct: 5.0,
          baseTAop: 1.9,
          baseTAct: 1.5,
          winRate: 38,
          dealCount: 10,
          avgDealSize: 0.50,
          growth: 45.0,
          pRem: 'Leverage new EU CSRD compliance mandates to target automotive & electronics manufacturing clients.',
          tRem: 'Bundle Carbon Footprint Assessment with Product LCA advisory to close 2 imminent proposals in EMEA.',
          rRem: 'Fast-track final LCA reporting delivery to recognize full advisory revenue.',
          naAcc: ['Tesla Gigafactory', 'Cummins Power'],
          emeaAcc: ['BMW Group ESG', 'Philips Healthcare'],
          apacAcc: ['Panasonic Green Impact'],
          latamAcc: ['Natura & Co']
        }
      ]
    },
    {
      id: 2,
      no: 2,
      name: 'Application Lifecycle Management Services',
      leadOwner: 'Vinayak',
      pipelineRemedialActions: quarter === 'Q1 FY 27'
        ? 'Ramp cross-selling of ALM modernization into existing SAP and Oracle enterprise accounts with specialized test automation suites.'
        : quarter === 'Q2 FY 27'
        ? 'Drive AI-accelerated automated test migration campaigns in European banking and healthcare accounts.'
        : quarter === 'Q3 FY 27'
        ? 'Expand cloud QA engineering partnerships with AWS and Microsoft to unlock enterprise DevOps budgets.'
        : quarter === 'Q4 FY 27'
        ? 'Deliver enterprise DevOps modernization bundles and execute multi-year QA renewal contracts.'
        : 'Sustained full-year ALM/PLM enterprise implementation delivery and automated QA governance.',
      tcvRemedialActions: quarter === 'Q1 FY 27'
        ? 'Lock in 3 multi-year managed services agreements before end of quarter with rate protection incentives.'
        : quarter === 'Q2 FY 27'
        ? 'Package multi-year service level agreements with guaranteed productivity gains for life science clients.'
        : quarter === 'Q3 FY 27'
        ? 'Finalize MedTech compliance agreements with tiered support and fixed transformation milestones.'
        : quarter === 'Q4 FY 27'
        ? 'Secure enterprise-wide renewal agreements across top 5 MedTech and financial services accounts.'
        : 'Annual multi-year managed services execution with high retention rates across global regulated sectors.',
      revenueRemedialActions: quarter === 'Q1 FY 27'
        ? 'Audit project delivery milestones and expedite customer UAT approvals across MedTech accounts.'
        : 'Ensure continuous sprint burndown and timely bi-weekly billing sign-offs.',
      subs: [
        {
          id: '2-1',
          no: '2.1',
          name: 'ALM PLM Implementations',
          owner: 'Vinayak',
          basePAop: 14.5,
          basePAct: 13.6,
          baseTAop: 5.0,
          baseTAct: 4.8,
          winRate: 46,
          dealCount: 16,
          avgDealSize: 0.85,
          growth: 15.2,
          pRem: 'Joint marketing with PTC Windchill and Siemens Teamcenter solution architects for mid-market migrations.',
          tRem: 'Close final negotiations on tier-1 MedTech PLM upgrade deal in Boston region.',
          rRem: 'Establish dedicated PMO cadence to verify billable milestone signoffs on time.',
          naAcc: ['Medtronic Devices', 'Boston Scientific', 'Thermo Fisher'],
          emeaAcc: ['Roche Diagnostics', 'Sanofi Industrial'],
          apacAcc: ['Olympus MedTech JP', 'Mindray Bio'],
          latamAcc: ['Bionexo Brasil']
        },
        {
          id: '2-2',
          no: '2.2',
          name: 'Enterprise DevOps & QA Automation',
          owner: 'Ananya',
          basePAop: 7.5,
          basePAct: 6.8,
          baseTAop: 2.5,
          baseTAct: 2.3,
          winRate: 41,
          dealCount: 13,
          avgDealSize: 0.52,
          growth: 22.0,
          pRem: 'Launch AI-augmented testing framework package to drive 15% higher pipeline velocity in BFSI.',
          tRem: 'Accelerate contract signoff for 2 European banking clients seeking regulatory test audit automation.',
          rRem: 'Shift QA automation resources to meet accelerated sprint acceptance dates.',
          naAcc: ['Capital One Dev', 'Fidelity Investments'],
          emeaAcc: ['BNP Paribas Bank', 'Barclays Tech'],
          apacAcc: ['DBS Bank Singapore'],
          latamAcc: ['Itau Unibanco']
        },
        {
          id: '2-3',
          no: '2.3',
          name: 'Legacy Modernization & Integration',
          owner: 'Vikram',
          basePAop: 6.0,
          basePAct: 5.0,
          baseTAop: 1.9,
          baseTAct: 1.7,
          winRate: 35,
          dealCount: 9,
          avgDealSize: 0.56,
          growth: 10.5,
          pRem: 'Initiate legacy mainframe code conversion discovery assessments at discounted entry pricing.',
          tRem: 'Bundle architectural review with cloud landing zone pilot for fast decision maker alignment.',
          rRem: 'Resolve integration architecture blockers to trigger phase-2 billing gates.',
          naAcc: ['Prudential Financial', 'Delta Air Lines IT'],
          emeaAcc: ['Lufthansa Systems'],
          apacAcc: ['Qantas IT Group'],
          latamAcc: ['LATAM Airlines']
        }
      ]
    },
    {
      id: 3,
      no: 3,
      name: 'Cognitive Digital thread Services',
      leadOwner: 'Niraj',
      pipelineRemedialActions: quarter === 'Q1 FY 27'
        ? 'Organize high-visibility Agentic AI executive roadshows in New York, London, and Tokyo to convert $10M+ uncommitted pipeline.'
        : quarter === 'Q2 FY 27'
        ? 'Deploy vertical AI agent blueprints for engineering co-pilots and smart factory dispatchers.'
        : quarter === 'Q3 FY 27'
        ? 'Expand hyperscaler co-sell programs with Google Cloud, AWS, and Microsoft Azure across key accounts.'
        : quarter === 'Q4 FY 27'
        ? 'Capitalize on enterprise generative AI adoption wave to close major multi-million dollar transformation programs.'
        : 'Enterprise cognitive digital thread portfolio scaling across cloud-native architectures, low-code platforms, and agentic AI.',
      tcvRemedialActions: quarter === 'Q1 FY 27'
        ? 'Establish rapid Proof-of-Concept sprint models (3-week delivery) to shorten enterprise procurement cycle times.'
        : quarter === 'Q2 FY 27'
        ? 'Bundle pre-approved enterprise compliance and security shields to reduce legal approval latency.'
        : quarter === 'Q3 FY 27'
        ? 'Implement outcome-based commercial agreements with milestone gates to accelerate deal closing.'
        : quarter === 'Q4 FY 27'
        ? 'Finalize large enterprise AI agent adoption contracts with multi-year expansion roadmaps.'
        : 'Full year AI and cloud contract value expansion driven by fast sandbox pilots and executive sponsorship.',
      revenueRemedialActions: quarter === 'Q1 FY 27'
        ? 'Deploy dedicated AI cloud engineers to accelerate sandbox deployment and recognize consumption revenue.'
        : 'Optimize multi-cloud delivery schedules to align with quarterly client billing cycles.',
      subs: [
        {
          id: '3-1',
          no: '3.1',
          name: 'Cloud Native Services',
          owner: 'Niraj',
          basePAop: 16.0,
          basePAct: 14.2,
          baseTAop: 5.5,
          baseTAct: 4.8,
          winRate: 39,
          dealCount: 22,
          avgDealSize: 0.65,
          growth: 28.0,
          pRem: 'Accelerate hyperscaler co-sell pipeline (AWS/GCP/Azure) with dedicated partner incentive funds.',
          tRem: 'Offer cloud consumption optimization credits for 2 major retail banking infrastructure migration bids.',
          rRem: 'Complete architecture validation gates to unlock tranche-1 cloud revenue recognition.',
          naAcc: ['Target Corp Cloud', 'Walmart Tech', 'JPMorgan Cloud'],
          emeaAcc: ['Santander Bank', 'Unilever Digital'],
          apacAcc: ['Rakuten Group', 'Telstra Cloud'],
          latamAcc: ['MercadoLibre']
        },
        {
          id: '3-2',
          no: '3.2',
          name: 'Low Code No Code Services',
          owner: 'Ravi',
          basePAop: 11.0,
          basePAct: 8.4,
          baseTAop: 3.8,
          baseTAct: 2.6,
          winRate: 31,
          dealCount: 15,
          avgDealSize: 0.56,
          growth: 34.0,
          pRem: 'Launch Appian/Mendix citizen development enablement bundle for insurance and healthcare claims operations.',
          tRem: 'Restructure proposals into quarterly agile delivery squads to overcome customer capital expenditure freezes.',
          rRem: 'Establish weekly sprint demos to validate user stories and release bi-weekly billable increments.',
          naAcc: ['Humana Health', 'Allstate Insurance', 'Aetna'],
          emeaAcc: ['Allianz SE', 'AXA Group'],
          apacAcc: ['AIA Insurance HK'],
          latamAcc: ['Bradesco Seguros']
        },
        {
          id: '3-3',
          no: '3.3',
          name: 'Agentic AI Services',
          owner: 'Niraj',
          basePAop: 15.0,
          basePAct: 11.2,
          baseTAop: 5.2,
          baseTAct: 3.5,
          winRate: 36,
          dealCount: 18,
          avgDealSize: 0.62,
          growth: 115.0,
          pRem: 'Establish vertical-specific AI agent blueprints (Engineering Copilot, Supply Chain Dispatcher, CAD Synthesizer).',
          tRem: 'Deploy executive demonstration sandbox and pre-built compliance guardrails to unblock legal review roadblocks.',
          rRem: 'Expedite LLM evaluation benchmarking to secure sign-off on phase-1 delivery milestones.',
          naAcc: ['Ford Smart Mobility', 'ExxonMobil Tech', 'Cisco Systems'],
          emeaAcc: ['TotalEnergies AI', 'Mercedes-Benz R&D'],
          apacAcc: ['Samsung Electronics', 'Sony Group'],
          latamAcc: ['Petrobras Digital']
        }
      ]
    },
    {
      id: 4,
      no: 4,
      name: 'Product Data Services',
      leadOwner: 'Paritosh',
      pipelineRemedialActions: quarter === 'Q1 FY 27'
        ? 'Target medical device & aerospace customers undergoing compliance audits for unified Product Master Data Management (MDM).'
        : quarter === 'Q2 FY 27'
        ? 'Launch automated data quality audit campaigns in discrete manufacturing and automotive supply chains.'
        : quarter === 'Q3 FY 27'
        ? 'Scale CAD/BOM consolidation offerings for major industrial merger and acquisition integrations.'
        : quarter === 'Q4 FY 27'
        ? 'Execute master data governance multi-year renewals and expand engineering analytics cross-sell.'
        : 'Enterprise-grade product data governance, CAD/BOM migration, and engineering intelligence delivery.',
      tcvRemedialActions: quarter === 'Q1 FY 27'
        ? 'Execute multi-year SLA rate locking and fast-track onboarding incentives for 2 enterprise accounts.'
        : quarter === 'Q2 FY 27'
        ? 'Offer guaranteed data migration turnaround SLA packages with fixed-price protection.'
        : quarter === 'Q3 FY 27'
        ? 'Standardize multi-site master data agreements with volume tiered pricing for global accounts.'
        : quarter === 'Q4 FY 27'
        ? 'Finalize multi-year engineering analytics subscriptions across industrial equipment leaders.'
        : 'Comprehensive annual contract value growth across master data management and telemetry analytics.',
      revenueRemedialActions: quarter === 'Q1 FY 27'
        ? 'Automate batch data cleansing scripts to accelerate deliverable acceptance across MDM accounts.'
        : 'Maintain high team billable utilization across global offshore centers.',
      subs: [
        {
          id: '4-1',
          no: '4.1',
          name: 'Product Data Services & MDM',
          owner: 'Paritosh',
          basePAop: 11.5,
          basePAct: 10.8,
          baseTAop: 3.9,
          baseTAct: 3.8,
          winRate: 44,
          dealCount: 14,
          avgDealSize: 0.77,
          growth: 16.0,
          pRem: 'Pitch automated data deduplication & Golden Record AI connectors to retail and discrete manufacturing accounts.',
          tRem: 'Finalize Statement of Work signatures for Tier-1 industrial distributor in Illinois.',
          rRem: 'Accelerate data deduplication batch sign-offs to complete monthly billing on time.',
          naAcc: ['Grainger Supply', '3M Industrial Data'],
          emeaAcc: ['Bosch Mobility MDM', 'Danfoss'],
          apacAcc: ['Panasonic MDM'],
          latamAcc: ['Embraer Parts']
        },
        {
          id: '4-2',
          no: '4.2',
          name: 'CAD/BOM Data Transformation',
          owner: 'Paritosh',
          basePAop: 7.0,
          basePAct: 6.1,
          baseTAop: 2.3,
          baseTAct: 2.0,
          winRate: 37,
          dealCount: 11,
          avgDealSize: 0.55,
          growth: 14.2,
          pRem: 'Standardize CAD migration accelerators for multi-CAD consolidation programs across tier-1 automotive suppliers.',
          tRem: 'Offer guaranteed data fidelity conversion pilot with 5-day turnaround SLA.',
          rRem: 'Automate CAD translation validation checks to eliminate customer rework and billing delays.',
          naAcc: ['General Motors Tech', 'BorgWarner'],
          emeaAcc: ['Valeo Auto Group', 'Continental AG'],
          apacAcc: ['Denso Corp'],
          latamAcc: ['Marcopolo Bus']
        },
        {
          id: '4-3',
          no: '4.3',
          name: 'Engineering Analytics & Intelligence',
          owner: 'Sneha',
          basePAop: 6.0,
          basePAct: 5.2,
          baseTAop: 2.0,
          baseTAct: 1.8,
          winRate: 36,
          dealCount: 8,
          avgDealSize: 0.65,
          growth: 31.5,
          pRem: 'Cross-sell predictive failure telemetry dashboards into industrial equipment customers.',
          tRem: 'Conduct executive demo sessions showing 20% warranty cost reduction to accelerate contract award.',
          rRem: 'Deliver executive telemetry dashboards early to secure sign-off on milestone payment 2.',
          naAcc: ['Parker Hannifin', 'Eaton Corp'],
          emeaAcc: ['SKF Group', 'Atlas Copco'],
          apacAcc: ['Daikin Industries'],
          latamAcc: ['Embraer Analytics']
        }
      ]
    }
  ];

  return baseOfferings.map(bo => {
    const subOfferings = bo.subs.map(sub => {
      const pAop = Number((sub.basePAop * m.aopMult).toFixed(1));
      let pAct = Number((sub.basePAct * m.actualMult).toFixed(1));
      const tAop = Number((sub.baseTAop * m.aopMult).toFixed(1));
      let tAct = Number((sub.baseTAct * m.actualMult).toFixed(1));

      // Rule: TCV AOP is double the Revenue AOP -> Revenue AOP = TCV AOP / 2
      const rAop = Number((tAop / 2).toFixed(1));
      let rAct = Number(((tAct / 2) * (0.92 + (m.attainBoost * 0.01))).toFixed(1));

      // Calculate gaps and attainment
      const pGap = Number((pAct - pAop).toFixed(1));
      const pAttain = pAop > 0 ? Number(((pAct / pAop) * 100).toFixed(1)) : 0;

      const tGap = Number((tAct - tAop).toFixed(1));
      const tAttain = tAop > 0 ? Number(((tAct / tAop) * 100).toFixed(1)) : 0;

      const rGap = Number((rAct - rAop).toFixed(1));
      const rAttain = rAop > 0 ? Number(((rAct / rAop) * 100).toFixed(1)) : 0;

      let status: 'Surplus' | 'On Track' | 'Moderate Gap' | 'Critical Gap' = 'On Track';
      const minAttain = Math.min(pAttain, tAttain, rAttain);
      if (minAttain >= 100) status = 'Surplus';
      else if (minAttain >= 90) status = 'On Track';
      else if (minAttain >= 75) status = 'Moderate Gap';
      else status = 'Critical Gap';

      // Regional breakdown distribution
      const naWeight = 0.55;
      const emeaWeight = 0.28;
      const apacWeight = 0.12;
      const latamWeight = 0.05;

      const regionalBreakdown: Record<RegionType, any> = {
        'North America (NA)': {
          region: 'North America (NA)',
          pipelineAop: Number((pAop * naWeight).toFixed(1)),
          pipelineActual: Number((pAct * naWeight).toFixed(1)),
          tcvAop: Number((tAop * naWeight).toFixed(1)),
          tcvActual: Number((tAct * naWeight).toFixed(1)),
          revenueAop: Number((rAop * naWeight).toFixed(1)),
          revenueActual: Number((rAct * naWeight).toFixed(1)),
          activeOpportunities: Math.max(2, Math.round(sub.dealCount * 0.55 * (m.actualMult / 1.0))),
          topAccounts: sub.naAcc
        },
        'Europe (EMEA)': {
          region: 'Europe (EMEA)',
          pipelineAop: Number((pAop * emeaWeight).toFixed(1)),
          pipelineActual: Number((pAct * emeaWeight).toFixed(1)),
          tcvAop: Number((tAop * emeaWeight).toFixed(1)),
          tcvActual: Number((tAct * emeaWeight).toFixed(1)),
          revenueAop: Number((rAop * emeaWeight).toFixed(1)),
          revenueActual: Number((rAct * emeaWeight).toFixed(1)),
          activeOpportunities: Math.max(1, Math.round(sub.dealCount * 0.28 * (m.actualMult / 1.0))),
          topAccounts: sub.emeaAcc
        },
        'Asia-Pacific (APAC)': {
          region: 'Asia-Pacific (APAC)',
          pipelineAop: Number((pAop * apacWeight).toFixed(1)),
          pipelineActual: Number((pAct * apacWeight).toFixed(1)),
          tcvAop: Number((tAop * apacWeight).toFixed(1)),
          tcvActual: Number((tAct * apacWeight).toFixed(1)),
          revenueAop: Number((rAop * apacWeight).toFixed(1)),
          revenueActual: Number((rAct * apacWeight).toFixed(1)),
          activeOpportunities: Math.max(1, Math.round(sub.dealCount * 0.12 * (m.actualMult / 1.0))),
          topAccounts: sub.apacAcc
        },
        'Latin America (LATAM)': {
          region: 'Latin America (LATAM)',
          pipelineAop: Number((pAop * latamWeight).toFixed(1)),
          pipelineActual: Number((pAct * latamWeight).toFixed(1)),
          tcvAop: Number((tAop * latamWeight).toFixed(1)),
          tcvActual: Number((tAct * latamWeight).toFixed(1)),
          revenueAop: Number((rAop * latamWeight).toFixed(1)),
          revenueActual: Number((rAct * latamWeight).toFixed(1)),
          activeOpportunities: 1,
          topAccounts: sub.latamAcc
        }
      };

      const deals = Math.round(sub.dealCount * (quarter === 'FY 27 Full Year' ? 3.8 : 1 + (m.actualMult - 1) * 0.5));

      const result: SubOffering = {
        id: `${sub.id}-${quarter.replace(/\s+/g, '')}`,
        no: sub.no,
        name: sub.name,
        owner: sub.owner,
        quarter,
        pipelineAop: pAop,
        pipelineActual: pAct,
        pipelineGap: pGap,
        pipelineAttainment: pAttain,
        pipelineRemedialActions: sub.pRem,
        tcvAop: tAop,
        tcvActual: tAct,
        tcvGap: tGap,
        tcvAttainment: tAttain,
        tcvRemedialActions: sub.tRem,
        revenueAop: rAop,
        revenueActual: rAct,
        revenueGap: rGap,
        revenueAttainment: rAttain,
        revenueRemedialActions: sub.rRem,
        regionalBreakdown,
        winRate: Math.min(65, sub.winRate + m.attainBoost),
        dealCount: deals,
        avgDealSize: sub.avgDealSize,
        historicalGrowthYoY: sub.growth,
        status
      };
      return metricFields.reduce((value, field) => setSubTotal(value, field, value[field]), result);
    });

    // Parent rollups
    const pAopTotal = Number(subOfferings.reduce((s, sub) => s + sub.pipelineAop, 0).toFixed(1));
    const pActTotal = Number(subOfferings.reduce((s, sub) => s + sub.pipelineActual, 0).toFixed(1));
    const pGapTotal = Number((pActTotal - pAopTotal).toFixed(1));
    const pAttainTotal = pAopTotal > 0 ? Number(((pActTotal / pAopTotal) * 100).toFixed(1)) : 0;

    const tAopTotal = Number(subOfferings.reduce((s, sub) => s + sub.tcvAop, 0).toFixed(1));
    const tActTotal = Number(subOfferings.reduce((s, sub) => s + sub.tcvActual, 0).toFixed(1));
    const tGapTotal = Number((tActTotal - tAopTotal).toFixed(1));
    const tAttainTotal = tAopTotal > 0 ? Number(((tActTotal / tAopTotal) * 100).toFixed(1)) : 0;

    const rAopTotal = Number(subOfferings.reduce((s, sub) => s + sub.revenueAop, 0).toFixed(1));
    const rActTotal = Number(subOfferings.reduce((s, sub) => s + sub.revenueActual, 0).toFixed(1));
    const rGapTotal = Number((rActTotal - rAopTotal).toFixed(1));
    const rAttainTotal = rAopTotal > 0 ? Number(((rActTotal / rAopTotal) * 100).toFixed(1)) : 0;

    let parentStatus: 'Surplus' | 'On Track' | 'Moderate Gap' | 'Critical Gap' = 'On Track';
    const minParentAttain = Math.min(pAttainTotal, tAttainTotal, rAttainTotal);
    if (minParentAttain >= 100) parentStatus = 'Surplus';
    else if (minParentAttain >= 90) parentStatus = 'On Track';
    else if (minParentAttain >= 75) parentStatus = 'Moderate Gap';
    else parentStatus = 'Critical Gap';

    return {
      id: bo.id,
      no: bo.no,
      name: bo.name,
      leadOwner: bo.leadOwner,
      quarter,
      pipelineAop: pAopTotal,
      pipelineActual: pActTotal,
      pipelineGap: pGapTotal,
      pipelineAttainment: pAttainTotal,
      pipelineRemedialActions: bo.pipelineRemedialActions,
      tcvAop: tAopTotal,
      tcvActual: tActTotal,
      tcvGap: tGapTotal,
      tcvAttainment: tAttainTotal,
      tcvRemedialActions: bo.tcvRemedialActions,
      revenueAop: rAopTotal,
      revenueActual: rActTotal,
      revenueGap: rGapTotal,
      revenueAttainment: rAttainTotal,
      revenueRemedialActions: (bo as any).revenueRemedialActions || 'Accelerate milestone acceptance testing and sprint delivery across key enterprise accounts.',
      status: parentStatus,
      subOfferings
    };
  });
}

function generateQuarterActions(quarter: QuarterType): RemedialAction[] {
  const qDates: Record<QuarterType, { d1: string; d2: string; d3: string }> = {
    'Q1 FY 27': { d1: '2026-09-20', d2: '2026-09-15', d3: '2026-09-28' },
    'Q2 FY 27': { d1: '2026-12-18', d2: '2026-12-15', d3: '2026-12-22' },
    'Q3 FY 27': { d1: '2027-03-20', d2: '2027-03-14', d3: '2027-03-29' },
    'Q4 FY 27': { d1: '2027-06-19', d2: '2027-06-15', d3: '2027-06-30' },
    'FY 27 Full Year': { d1: '2027-06-30', d2: '2027-06-30', d3: '2027-06-30' }
  };
  const dates = qDates[quarter];

  return [
    {
      id: `act-1-${quarter}`,
      type: 'Pipeline',
      offeringId: 1,
      subOfferingId: `1-1-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Digital Thread Enablement Services',
      subOfferingName: 'Model Based Systems Engineering',
      owner: 'Bala',
      title: 'Defense & Aerospace Targeted MBSE Roadshow',
      description: `Launch co-branded webinars with SysML partners targeting tier-1 defense contractors in NA and EMEA to generate new qualified RFPs for ${quarter}.`,
      rootCause: 'Elongated qualification cycle and strict security compliance approvals delaying pipeline progression.',
      expectedImpact: Number((2.4 * (quarter === 'FY 27 Full Year' ? 3.5 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d1,
      priority: 'High',
      status: quarter === 'Q4 FY 27' || quarter === 'FY 27 Full Year' ? 'Completed' : 'In Progress',
      progressPercent: quarter === 'Q1 FY 27' ? 65 : quarter === 'Q2 FY 27' ? 85 : 100,
      keyStakeholders: ['Bala (Lead)', 'Rajesh D', 'NA Sales Director']
    },
    {
      id: `act-2-${quarter}`,
      type: 'TCV',
      offeringId: 1,
      subOfferingId: `1-1-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Digital Thread Enablement Services',
      subOfferingName: 'Model Based Systems Engineering',
      owner: 'Bala',
      title: 'Executive Sponsorship on Lockheed & Boeing Pursuits',
      description: 'Engage VP/SVP level executive sponsors to structure phased pilot milestone deliverables to accelerate final award.',
      rootCause: 'Contract size causing multi-committee budgetary reviews.',
      expectedImpact: Number((1.2 * (quarter === 'FY 27 Full Year' ? 3.2 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d2,
      priority: 'Critical',
      status: 'In Progress',
      progressPercent: 75,
      keyStakeholders: ['Bala', 'VP Aerospace Lead']
    },
    {
      id: `act-3-${quarter}`,
      type: 'Pipeline',
      offeringId: 1,
      subOfferingId: `1-3-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Digital Thread Enablement Services',
      subOfferingName: 'Service Lifecycle Management',
      owner: 'Srikanth',
      title: 'Installed Base Field Service Optimization Blitz',
      description: 'Target 25 existing industrial machinery clients with connected warranty and spare parts predictive analytics modules.',
      rootCause: 'Lead generation gap due to legacy focus solely on CAD/PLM rather than aftermarket services.',
      expectedImpact: Number((2.1 * (quarter === 'FY 27 Full Year' ? 3.0 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d1,
      priority: 'Critical',
      status: quarter === 'Q1 FY 27' ? 'Open' : 'In Progress',
      progressPercent: quarter === 'Q1 FY 27' ? 30 : 70,
      keyStakeholders: ['Srikanth', 'Client Partner Lead']
    },
    {
      id: `act-4-${quarter}`,
      type: 'TCV',
      offeringId: 1,
      subOfferingId: `1-3-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Digital Thread Enablement Services',
      subOfferingName: 'Service Lifecycle Management',
      owner: 'Srikanth',
      title: 'Carrier HVAC & Otis Warranty Transformation Closing',
      description: 'Provide guaranteed SLA performance credits and phased deployment schedules to unblock procurement signoff.',
      rootCause: 'Client procurement pushback on upfront capital expenditure.',
      expectedImpact: Number((0.8 * (quarter === 'FY 27 Full Year' ? 2.5 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d2,
      priority: 'High',
      status: 'In Progress',
      progressPercent: 60,
      keyStakeholders: ['Srikanth', 'Legal/Commercial Team']
    },
    {
      id: `act-5-${quarter}`,
      type: 'Pipeline',
      offeringId: 3,
      subOfferingId: `3-3-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Cognitive Digital thread Services',
      subOfferingName: 'Agentic AI Services',
      owner: 'Niraj',
      title: 'Enterprise Agentic AI Executive Sandbox & Co-Innovation Program',
      description: 'Deploy pre-packaged interactive sandbox environments for Ford and ExxonMobil demonstrating engineering copilot ROI.',
      rootCause: 'Lack of pre-configured vertical proof-of-concepts causing prolonged exploratory discussions.',
      expectedImpact: Number((4.2 * (quarter === 'FY 27 Full Year' ? 3.8 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d1,
      priority: 'Critical',
      status: 'In Progress',
      progressPercent: 80,
      keyStakeholders: ['Niraj', 'Chief AI Architect', 'NA Enterprise VP']
    },
    {
      id: `act-6-${quarter}`,
      type: 'TCV',
      offeringId: 3,
      subOfferingId: `3-3-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Cognitive Digital thread Services',
      subOfferingName: 'Agentic AI Services',
      owner: 'Niraj',
      title: 'Fast-Track Enterprise Security & Governance Shield Package',
      description: 'Bundle enterprise SOC2, EU AI Act compliance, and air-gapped LLM deployment architectures into closing proposals.',
      rootCause: 'Customer infosec and legal compliance concerns delaying contract execution.',
      expectedImpact: Number((1.8 * (quarter === 'FY 27 Full Year' ? 3.0 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d3,
      priority: 'Critical',
      status: 'In Progress',
      progressPercent: 50,
      keyStakeholders: ['Niraj', 'Security Practice Lead']
    },
    {
      id: `act-7-${quarter}`,
      type: 'Pipeline',
      offeringId: 3,
      subOfferingId: `3-2-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Cognitive Digital thread Services',
      subOfferingName: 'Low Code No Code Services',
      owner: 'Ravi',
      title: 'Insurance & Healthcare Claims Automation Pack',
      description: 'Package pre-built Mendix/Appian underwriting and claims workflow accelerators for Humana and Allianz.',
      rootCause: 'Generic messaging failing to differentiate against niche boutique low-code agencies.',
      expectedImpact: Number((2.8 * (quarter === 'FY 27 Full Year' ? 2.8 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d2,
      priority: 'High',
      status: 'Under Review',
      progressPercent: 45,
      keyStakeholders: ['Ravi', 'Insurance Industry Lead']
    },
    {
      id: `act-8-${quarter}`,
      type: 'TCV',
      offeringId: 3,
      subOfferingId: `3-2-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Cognitive Digital thread Services',
      subOfferingName: 'Low Code No Code Services',
      owner: 'Ravi',
      title: 'Humana & Allstate Agile Squad Contracting',
      description: 'Switch from fixed-price risk model to dedicated quarterly delivery pods ($350k/pod/quarter) to secure immediate start.',
      rootCause: 'Fixed-price scope creep negotiations stalled procurement.',
      expectedImpact: Number((1.1 * (quarter === 'FY 27 Full Year' ? 2.5 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d2,
      priority: 'High',
      status: 'In Progress',
      progressPercent: 70,
      keyStakeholders: ['Ravi', 'Commercial Operations']
    },
    {
      id: `act-9-${quarter}`,
      type: 'Pipeline',
      offeringId: 1,
      subOfferingId: `1-4-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Digital Thread Enablement Services',
      subOfferingName: 'Design for Sustainability',
      owner: 'Ravi',
      title: 'EU CSRD Compliance & Product Carbon Footprint Blitz',
      description: 'Target European automotive and industrial accounts with automated digital product passport & LCA toolchain.',
      rootCause: 'Slow ramp of sustainability budgets outside of regulatory-compelled European jurisdictions.',
      expectedImpact: Number((1.2 * (quarter === 'FY 27 Full Year' ? 2.6 : 1)).toFixed(1)),
      targetQuarter: quarter,
      dueDate: dates.d3,
      priority: 'Medium',
      status: 'In Progress',
      progressPercent: 55,
      keyStakeholders: ['Ravi', 'EMEA Solutions Lead']
    },
    {
      id: `act-10-${quarter}`,
      type: 'TCV',
      offeringId: 1,
      subOfferingId: `1-4-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Digital Thread Enablement Services',
      subOfferingName: 'Design for Sustainability',
      owner: 'Ravi',
      title: 'BMW & Philips ESG Advisory Expansion',
      description: 'Attach Sustainability Data Pipeline services directly onto existing CAD/PLM master contracts.',
      rootCause: 'Standalone ESG budget constraints.',
      expectedImpact: 0.5,
      targetQuarter: quarter,
      dueDate: dates.d2,
      priority: 'Medium',
      status: 'Completed',
      progressPercent: 100,
      keyStakeholders: ['Ravi', 'BMW Account Executive']
    },
    {
      id: `act-11-${quarter}`,
      type: 'Pipeline',
      offeringId: 2,
      subOfferingId: `2-1-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Application Lifecycle Management Services',
      subOfferingName: 'ALM PLM Implementations',
      owner: 'Vinayak',
      title: 'MedTech FDA 21 CFR Part 11 Fast-Track Package',
      description: 'Drive high-margin regulatory validated ALM/PLM deployment bundles for Boston Scientific and Medtronic.',
      rootCause: 'Extended validation requirement scoping.',
      expectedImpact: 1.5,
      targetQuarter: quarter,
      dueDate: dates.d1,
      priority: 'High',
      status: 'In Progress',
      progressPercent: 85,
      keyStakeholders: ['Vinayak', 'Life Sciences Practice']
    },
    {
      id: `act-12-${quarter}`,
      type: 'TCV',
      offeringId: 2,
      subOfferingId: `2-1-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Application Lifecycle Management Services',
      subOfferingName: 'ALM PLM Implementations',
      owner: 'Vinayak',
      title: 'Multi-Year MedTech Managed Services Lock-in',
      description: 'Execute 3-year support SLA with tiered staffing discount to secure multi-million TCV.',
      rootCause: 'Customer requested multi-year cost certainty.',
      expectedImpact: 0.6,
      targetQuarter: quarter,
      dueDate: dates.d2,
      priority: 'High',
      status: 'Completed',
      progressPercent: 100,
      keyStakeholders: ['Vinayak', 'Contracts Manager']
    },
    {
      id: `act-13-${quarter}`,
      type: 'Pipeline',
      offeringId: 4,
      subOfferingId: `4-1-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Product Data Services',
      subOfferingName: 'Product Data Services & MDM',
      owner: 'Paritosh',
      title: 'Retail & Discrete Manufacturing MDM Campaign',
      description: 'Joint initiative with Informatica/Stibo to target 12 mid-market industrial distributors.',
      rootCause: 'Partner lead registration latency.',
      expectedImpact: 1.4,
      targetQuarter: quarter,
      dueDate: dates.d3,
      priority: 'Medium',
      status: 'In Progress',
      progressPercent: 60,
      keyStakeholders: ['Paritosh', 'Partner Alliances']
    },
    {
      id: `act-14-${quarter}`,
      type: 'TCV',
      offeringId: 4,
      subOfferingId: `4-1-${quarter.replace(/\s+/g, '')}`,
      offeringName: 'Product Data Services',
      subOfferingName: 'Product Data Services & MDM',
      owner: 'Paritosh',
      title: 'Grainger & 3M Master Data Contract Execution',
      description: 'Finalize master agreement renewals with added engineering taxonomy governance modules.',
      rootCause: 'Procurement legal review cycles.',
      expectedImpact: 0.4,
      targetQuarter: quarter,
      dueDate: dates.d2,
      priority: 'High',
      status: 'Completed',
      progressPercent: 100,
      keyStakeholders: ['Paritosh', 'Midwest VP']
    }
  ];
}

// Full quarterly datasets
export const ALL_QUARTER_OFFERINGS: Record<QuarterType, Offering[]> = {
  'Q1 FY 27': generateQuarterOfferings('Q1 FY 27'),
  'Q2 FY 27': generateQuarterOfferings('Q2 FY 27'),
  'Q3 FY 27': generateQuarterOfferings('Q3 FY 27'),
  'Q4 FY 27': generateQuarterOfferings('Q4 FY 27'),
  'FY 27 Full Year': generateQuarterOfferings('FY 27 Full Year')
};

export const ALL_QUARTER_ACTIONS: Record<QuarterType, RemedialAction[]> = {
  'Q1 FY 27': generateQuarterActions('Q1 FY 27'),
  'Q2 FY 27': generateQuarterActions('Q2 FY 27'),
  'Q3 FY 27': generateQuarterActions('Q3 FY 27'),
  'Q4 FY 27': generateQuarterActions('Q4 FY 27'),
  'FY 27 Full Year': generateQuarterActions('FY 27 Full Year')
};

export const INITIAL_OFFERINGS: Offering[] = ALL_QUARTER_OFFERINGS['Q1 FY 27'];
export const INITIAL_ACTIONS: RemedialAction[] = ALL_QUARTER_ACTIONS['Q1 FY 27'];
