import React, { useState, useRef } from 'react';
import {
  Globe2,
  MapPin,
  Building,
  TrendingUp,
  TrendingDown,
  Users,
  Compass,
  ArrowRight,
  Briefcase,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Target,
  Sparkles,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Offering, RegionType, FilterOptions } from '../types/dashboard';
import { REGIONS } from '../data/initialData';
import { formatCurrency, formatPercent, getStatusBadgeConfig, stripBrackets } from '../utils/calculations';
import { CustomMultiLineTick } from './CustomMultiLineTick';

interface Layer2RegionalProps {
  offerings: Offering[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenNewActionModal: (type: 'Pipeline' | 'TCV') => void;
}

interface RegionalDealItem {
  id: string;
  accountName: string;
  dealName: string;
  offeringId: number;
  offeringName: string;
  offeringNo: number;
  subOfferingId: string;
  subOfferingName: string;
  owner: string;
  region: RegionType;
  stage: string;
  winProbability: number;
  pipelineValue: number;
  projectedTcv: number;
  expectedClose: string;
  industry: string;
  strategicMilestone: string;
}

export const Layer2Regional: React.FC<Layer2RegionalProps> = ({
  offerings,
  filters,
  setFilters,
  onOpenNewActionModal
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionType>('North America (NA)');
  const [expandedOfferings, setExpandedOfferings] = useState<Record<string, boolean>>({
    'offering_1': true,
    'offering_2': true,
    'offering_3': true,
    'offering_4': true
  });

  // Selected deal scope for interactive deal details table
  const [selectedDealScope, setSelectedDealScope] = useState<{
    type: 'offering' | 'subOffering' | 'all';
    id?: string | number;
    name: string;
    parentOfferingName?: string;
    offeringNo?: number;
    owner?: string;
    dealCount: number;
  } | null>(null);

  const [dealSearchTerm, setDealSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const dealsTableRef = useRef<HTMLDivElement>(null);

  const toggleOffering = (offeringId: number) => {
    setExpandedOfferings(prev => ({
      ...prev,
      [offeringId]: !prev[offeringId]
    }));
  };

  const toggleAllOfferings = () => {
    const allExpanded = offerings.every(off => expandedOfferings[off.id]);
    const newState: Record<string, boolean> = {};
    offerings.forEach(off => {
      newState[off.id] = !allExpanded;
    });
    setExpandedOfferings(newState);
  };

  const handleSelectDealScope = (scope: {
    type: 'offering' | 'subOffering' | 'all';
    id?: string | number;
    name: string;
    parentOfferingName?: string;
    offeringNo?: number;
    owner?: string;
    dealCount: number;
  }) => {
    if (selectedDealScope?.type === scope.type && selectedDealScope?.id === scope.id) {
      // Toggle off to all
      setSelectedDealScope(null);
    } else {
      setSelectedDealScope(scope);
      setTimeout(() => {
        dealsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Regional aggregations
  const regionalSummary = REGIONS.map(reg => {
    let pipelineAop = 0;
    let pipelineActual = 0;
    let tcvAop = 0;
    let tcvActual = 0;
    let activeDeals = 0;
    const allAccounts: string[] = [];

    offerings.forEach(off => {
      off.subOfferings.forEach(sub => {
        const data = sub.regionalBreakdown[reg.name];
        if (data) {
          pipelineAop += data.pipelineAop;
          pipelineActual += data.pipelineActual;
          tcvAop += data.tcvAop;
          tcvActual += data.tcvActual;
          activeDeals += data.activeOpportunities;
          allAccounts.push(...data.topAccounts);
        }
      });
    });

    const pipelineGap = Number((pipelineActual - pipelineAop).toFixed(2));
    const pipelineAttainment = pipelineAop > 0 ? Number(((pipelineActual / pipelineAop) * 100).toFixed(1)) : 0;
    const tcvGap = Number((tcvActual - tcvAop).toFixed(2));
    const tcvAttainment = tcvAop > 0 ? Number(((tcvActual / tcvAop) * 100).toFixed(1)) : 0;

    return {
      ...reg,
      pipelineAop: Number(pipelineAop.toFixed(2)),
      pipelineActual: Number(pipelineActual.toFixed(2)),
      pipelineGap,
      pipelineAttainment,
      tcvAop: Number(tcvAop.toFixed(2)),
      tcvActual: Number(tcvActual.toFixed(2)),
      tcvGap,
      tcvAttainment,
      activeDeals,
      topAccounts: Array.from(new Set(allAccounts)).slice(0, 8)
    };
  });

  const activeRegionData = regionalSummary.find(r => r.name === selectedRegion) || regionalSummary[0];

  // Offering and Sub-offering breakdown for selected region
  const regionalOfferingRows = offerings.map(off => {
    let pipelineAop = 0;
    let pipelineActual = 0;
    let tcvAop = 0;
    let tcvActual = 0;
    let activeOpportunities = 0;

    const subOfferingsList = off.subOfferings.map(sub => {
      const rData = sub.regionalBreakdown[selectedRegion];
      const pAop = rData?.pipelineAop || 0;
      const pAct = rData?.pipelineActual || 0;
      const pG = Number((pAct - pAop).toFixed(2));
      const pAtt = pAop > 0 ? (pAct / pAop) * 100 : 0;
      const tAop = rData?.tcvAop || 0;
      const tAct = rData?.tcvActual || 0;
      const tG = Number((tAct - tAop).toFixed(2));
      const tAtt = tAop > 0 ? (tAct / tAop) * 100 : 0;
      const activeOps = rData?.activeOpportunities || 0;

      pipelineAop += pAop;
      pipelineActual += pAct;
      tcvAop += tAop;
      tcvActual += tAct;
      activeOpportunities += activeOps;

      return {
        id: sub.id,
        name: sub.name,
        owner: sub.owner,
        pipelineAop: pAop,
        pipelineActual: pAct,
        pipelineGap: pG,
        pipelineAttainment: pAtt,
        tcvAop: tAop,
        tcvActual: tAct,
        tcvGap: tG,
        tcvAttainment: tAtt,
        activeOpportunities: activeOps,
        topAccounts: rData?.topAccounts || []
      };
    });

    const pGap = Number((pipelineActual - pipelineAop).toFixed(2));
    const pAttain = pipelineAop > 0 ? (pipelineActual / pipelineAop) * 100 : 0;
    const tGap = Number((tcvActual - tcvAop).toFixed(2));
    const tAttain = tcvAop > 0 ? (tcvActual / tcvAop) * 100 : 0;

    return {
      offeringName: off.name,
      offeringId: off.id,
      offeringNo: off.no,
      leadOwner: off.leadOwner,
      subOfferingsCount: off.subOfferings.length,
      pipelineAop: Number(pipelineAop.toFixed(2)),
      pipelineActual: Number(pipelineActual.toFixed(2)),
      pipelineGap: pGap,
      pipelineAttainment: pAttain,
      tcvAop: Number(tcvAop.toFixed(2)),
      tcvActual: Number(tcvActual.toFixed(2)),
      tcvGap: tGap,
      tcvAttainment: tAttain,
      activeOpportunities,
      subOfferings: subOfferingsList
    };
  });

  // Generate complete list of deals for the selected region
  const regionalDealsList: RegionalDealItem[] = offerings.flatMap(off => {
    return off.subOfferings.flatMap(sub => {
      const rData = sub.regionalBreakdown[selectedRegion];
      if (!rData) return [];

      const topAccs = rData.topAccounts || [];
      const count = Math.max(rData.activeOpportunities || 1, topAccs.length);

      const industryMap: Record<string, string> = {
        'Lockheed Martin Aero': 'Aerospace & Defense',
        'Boeing Defense': 'Aerospace & Defense',
        'General Dynamics': 'Defense Systems',
        'Airbus Defence': 'Aerospace & Defense',
        'BAE Systems': 'Defense Technology',
        'Mitsubishi Heavy Ind': 'Industrial Heavy Machinery',
        'Hanwha Aerospace': 'Aerospace & Systems',
        'Embraer Defense': 'Aviation & Defense',
        'Caterpillar Global': 'Heavy Equipment & Machinery',
        'John Deere': 'AgTech & Industrial',
        'Honeywell Plant': 'Industrial Automation',
        'Siemens AG Factories': 'Industrial Automation',
        'Schneider Electric': 'Energy Management',
        'Toyota Motor Manuf.': 'Automotive & Mobility',
        'Komatsu': 'Heavy Mining Equipment',
        'Ternium Steel Plant': 'Steel & Metals',
        'Carrier HVAC Corp': 'Building Technologies',
        'Otis Elevator Global': 'Building Infrastructure',
        'ABB Service Group': 'Power & Industrial',
        'KONE Corp': 'Urban Mobility Systems',
        'Hitachi Plant Tech': 'High-Tech Manufacturing',
        'WEG Electric Equipment': 'Industrial Motors',
        'Tesla Energy': 'CleanTech & Automotive',
        'Rivian Automotive': 'Electric Mobility',
        'Vestas Wind Systems': 'Renewable Energy',
        'Enel Green Power': 'Utilities & Renewable',
        'Goldwind Sci & Tech': 'Clean Energy',
        'Suzlon Energy': 'Wind Power Tech',
        'Natura & Co Eco': 'Sustainable Packaging',
        'Raytheon Tech Corp': 'Aerospace Systems',
        'Northrop Grumman': 'Defense & Space',
        'Collins Aerospace': 'Avionics & Flight',
        'Safran Group': 'Aviation & Optronics',
        'Thales Group': 'Defense & Cyber',
        'Kawasaki Heavy Ind': 'Heavy Transportation',
        'Subaru Aerospace': 'Aerospace Division',
        'Helibras Helicopters': 'Rotorcraft Systems',
        'Ford Model e': 'Electric Vehicles',
        'General Motors EV': 'Automotive EV Platform',
        'BMW Group': 'Automotive OEM',
        'Mercedes-Benz AG': 'Automotive OEM',
        'Hyundai Motor Group': 'Automotive Mobility',
        'BYD Auto Co': 'Electric Mobility & Batteries',
        'Stellantis South America': 'Automotive OEM',
        'Boston Scientific': 'Medical Technology',
        'Medtronic Global': 'Medical Devices',
        'Philips Healthcare': 'HealthTech Solutions',
        'Siemens Healthineers': 'Medical Imaging',
        'Olympus Medical': 'Endoscopy & Surgical',
        'Terumo Medical Corp': 'Cardiovascular Tech',
        'Fleury Group Health': 'Diagnostic Medicine',
        'Grainger Supply': 'Industrial Distribution',
        '3M Industrial Data': 'Diversified Manufacturing',
        'Bosch Mobility MDM': 'Automotive Components',
        'Danfoss': 'Climate & Energy Solutions',
        'Panasonic MDM': 'Electronics & Battery',
        'Embraer Parts': 'Aviation Logistics',
        'General Motors Tech': 'Automotive Engineering',
        'BorgWarner': 'Clean Powertrain Tech',
        'Valeo Auto Group': 'Automotive Driving Systems',
        'Continental AG': 'Automotive Systems',
        'Denso Corp': 'Automotive Components',
        'Marcopolo Bus': 'Commercial Vehicles',
        'Parker Hannifin': 'Motion & Control Tech',
        'Eaton Corp': 'Intelligent Power',
        'SKF Group': 'Bearings & Condition Monitoring',
        'Atlas Copco': 'Industrial Compressors',
        'Daikin Industries': 'HVAC & Refrigeration',
        'Embraer Analytics': 'Aviation Telemetry'
      };

      const stages = [
        { stage: 'Stage 4 - Executive Negotiation', prob: 75, close: 'Q1 Close' },
        { stage: 'Stage 5 - Contract & SOW Review', prob: 90, close: 'Immediate Q1' },
        { stage: 'Stage 3 - Technical Validation & POC', prob: 60, close: 'Q2 Target' },
        { stage: 'Stage 2 - Solution Scoping', prob: 40, close: 'Q2/Q3 Pipeline' }
      ];

      const deals: RegionalDealItem[] = [];
      for (let i = 0; i < count; i++) {
        const accName = topAccs[i] || `${off.name.split(':')[0]} Enterprise Account ${i + 1}`;
        const stageObj = stages[i % stages.length];
        const ind = industryMap[accName] || 'Discrete Manufacturing';
        const dealVal = Number(((rData.pipelineActual / count) * (0.85 + (i * 0.15))).toFixed(2));
        const tcvVal = Number(((rData.tcvActual / count) * (0.85 + (i * 0.15))).toFixed(2));

        deals.push({
          id: `deal-${sub.id}-${selectedRegion.replace(/\s+/g, '')}-${i}`,
          accountName: accName,
          dealName: `${accName} • ${sub.name} Modernization`,
          offeringId: off.id,
          offeringName: off.name,
          offeringNo: off.no,
          subOfferingId: sub.id,
          subOfferingName: sub.name,
          owner: sub.owner,
          region: selectedRegion,
          stage: stageObj.stage,
          winProbability: stageObj.prob,
          pipelineValue: Math.max(0.1, dealVal),
          projectedTcv: Math.max(0.05, tcvVal),
          expectedClose: stageObj.close,
          industry: ind,
          strategicMilestone: `${sub.owner}: ${sub.tcvRemedialActions || 'Accelerate client milestone acceptance and finalize MSA terms.'}`
        });
      }

      return deals;
    });
  });

  // Filter deals based on selection and search
  const filteredDeals = regionalDealsList.filter(deal => {
    // Scope filter
    if (selectedDealScope) {
      if (selectedDealScope.type === 'offering' && deal.offeringId !== selectedDealScope.id) {
        return false;
      }
      if (selectedDealScope.type === 'subOffering' && deal.subOfferingId !== selectedDealScope.id) {
        return false;
      }
    }

    // Stage filter
    if (stageFilter !== 'All' && !deal.stage.toLowerCase().includes(stageFilter.toLowerCase())) {
      return false;
    }

    // Search query
    if (dealSearchTerm.trim() !== '') {
      const q = dealSearchTerm.toLowerCase();
      return (
        deal.accountName.toLowerCase().includes(q) ||
        deal.dealName.toLowerCase().includes(q) ||
        deal.subOfferingName.toLowerCase().includes(q) ||
        deal.owner.toLowerCase().includes(q) ||
        deal.industry.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalFilteredPipeline = filteredDeals.reduce((sum, d) => sum + d.pipelineValue, 0);
  const totalFilteredTcv = filteredDeals.reduce((sum, d) => sum + d.projectedTcv, 0);

  // Chart data: Regional comparisons
  const regionComparisonChartData = regionalSummary.map(r => ({
    name: r.code,
    fullName: r.name,
    pipelineAop: r.pipelineAop,
    pipelineActual: r.pipelineActual,
    tcvAop: r.tcvAop,
    tcvActual: r.tcvActual
  }));

  // Offering distribution in selected region
  const offeringInRegionData = offerings.map(off => {
    let pActual = 0;
    let tActual = 0;
    off.subOfferings.forEach(sub => {
      const data = sub.regionalBreakdown[selectedRegion];
      if (data) {
        pActual += data.pipelineActual;
        tActual += data.tcvActual;
      }
    });
    return {
      name: off.name.split(':')[0],
      fullName: off.name,
      pipelineActual: Number(pActual.toFixed(2)),
      tcvActual: Number(tActual.toFixed(2))
    };
  });

  return (
    <div className="space-y-6 pb-12">

      {/* Geography Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              Geography View & Market Performance
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            In-depth geographic telemetry across North America, Europe, Asia-Pacific, and Latin America. Track localized pipeline velocity, key industry digital thread deals, and regional TCV conversion bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Quarter</span>
            <span className="text-xs font-bold text-slate-700">{filters.quarter}</span>
          </div>
          <button
            onClick={() => onOpenNewActionModal('Pipeline')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Compass className="w-3.5 h-3.5" />
            Initiate Geo Action
          </button>
        </div>
      </div>

      {/* Region Selector Tabs / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {regionalSummary.map((reg) => {
          const isSelected = selectedRegion === reg.name;
          const status = reg.pipelineGap >= 0 ? 'Surplus' : 'Deficit';

          return (
            <button
              key={reg.name}
              onClick={() => {
                setSelectedRegion(reg.name);
                setSelectedDealScope(null);
              }}
              className={`p-4 rounded-xl text-left transition-all relative overflow-hidden border ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-900">{reg.code}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  status === 'Surplus'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {reg.pipelineAttainment}% AOP
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-700 truncate mb-3" title={reg.name}>
                {reg.name}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Pipe Attained</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(reg.pipelineActual, filters.unit)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">TCV Booked</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(reg.tcvActual, filters.unit)}</span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-md">
                  <span>Selected Focus Market</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Region Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Regional Visual Charts */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedRegion}: Solution Offering Contribution ($M)
              </h3>
              <p className="text-xs text-slate-500">
                Pipeline and TCV contribution across the 4 solution pillars in this market
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              Coverage: {(activeRegionData.pipelineActual / (activeRegionData.tcvActual || 1)).toFixed(1)}x
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={offeringInRegionData} margin={{ top: 12, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={<CustomMultiLineTick maxChars={12} fontSize={8} lineHeight={10} />}
                  interval={0}
                  height={55}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit={filters.unit === 'M' ? 'M' : 'K'} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(1)}${filters.unit}`, '']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
                <Bar dataKey="pipelineActual" name="Pipeline Generated ($M)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tcvActual" name="TCV Booked ($M)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs mt-2">
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Regional Pipeline Gap</span>
              <span className={`text-sm font-bold ${activeRegionData.pipelineGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(activeRegionData.pipelineGap, filters.unit, true)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Regional TCV Gap</span>
              <span className={`text-sm font-bold ${activeRegionData.tcvGap >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatCurrency(activeRegionData.tcvGap, filters.unit, true)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Regional Opportunities</span>
              <span className="text-sm font-bold text-slate-900">
                {activeRegionData.activeDeals} Active Pursuits
              </span>
            </div>
          </div>
        </div>

        {/* Strategic Target Accounts & Field Intelligence */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Key Industry Digital Thread Deals in {activeRegionData.code}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Primary enterprise and industry digital thread pursuits driving pipeline generation and RFP pursuits in {activeRegionData.name}:
            </p>

            <div className="space-y-2">
              {activeRegionData.topAccounts.map((account, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-slate-800">{account}</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Digital Thread Pursuit
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs">
            <span className="font-bold text-indigo-900 block mb-0.5">Market Dynamics:</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {activeRegionData.description}
            </p>
          </div>
        </div>

      </div>

      {/* Regional Offering & Sub-Offering Breakdown Table (Collapsible) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Offering & Sub-Offering Breakdown for {selectedRegion}
            </h3>
            <p className="text-xs text-slate-500">
              Click on any offering to collapse/expand. Click on any <span className="font-semibold text-blue-600">Active Deals</span> badge to view granular deal details below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAllOfferings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
              title="Toggle all offering accordions"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
              {offerings.every(off => expandedOfferings[off.id]) ? 'Collapse All' : 'Expand All'}
            </button>
            <span className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700">
              {regionalOfferingRows.length} Offerings • 11 Sub-Offerings
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 min-w-[220px]">Solution Offering</th>
                <th className="py-3 px-3 min-w-[200px]">Sub Offering</th>
                <th className="py-3 px-3 min-w-[110px]">Owner</th>
                <th className="py-3 px-3 text-right bg-blue-50/50">Pipeline AOP</th>
                <th className="py-3 px-3 text-right bg-blue-50/50">Pipeline Actual</th>
                <th className="py-3 px-3 text-right bg-blue-50/50">Pipeline Gap</th>
                <th className="py-3 px-3 text-right bg-emerald-50/50">TCV AOP</th>
                <th className="py-3 px-3 text-right bg-emerald-50/50">TCV Actual</th>
                <th className="py-3 px-3 text-right bg-emerald-50/50">TCV Gap</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Active Deals</th>
              </tr>
            </thead>
            <tbody>
              {regionalOfferingRows.map((row) => {
                const isExpanded = !!expandedOfferings[row.offeringId];
                const isOfferingSelected = selectedDealScope?.type === 'offering' && selectedDealScope?.id === row.offeringId;

                return (
                  <React.Fragment key={row.offeringId}>
                    {/* Offering Master Row (Collapsible Header) */}
                    <tr
                      onClick={() => toggleOffering(row.offeringId)}
                      className={`transition-colors border-t-2 border-slate-200 cursor-pointer select-none ${
                        isOfferingSelected
                          ? 'bg-blue-50/90'
                          : 'bg-slate-50/90 hover:bg-slate-100'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOffering(row.offeringId);
                            }}
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {row.offeringName}
                            </div>
                            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                              Offering {row.offeringNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sub Offering column in rollup row (clean summary badge without repeating solution offering) */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                          <Layers className="w-3 h-3 text-slate-500" />
                          All Sub-Offerings ({row.subOfferingsCount})
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 text-xs">{row.leadOwner}</div>
                        <span className="text-[10px] font-medium text-slate-500">Practice Lead</span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-700 bg-blue-50/20">
                        {formatCurrency(row.pipelineAop, filters.unit)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-blue-800 bg-blue-50/20">
                        {formatCurrency(row.pipelineActual, filters.unit)}
                        <span className="block text-[10px] font-normal text-blue-600">
                          {formatPercent(row.pipelineAttainment)}
                        </span>
                      </td>
                      <td className={`py-3.5 px-3 text-right font-mono font-semibold bg-blue-50/20 ${
                        row.pipelineGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(row.pipelineGap, filters.unit, true)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-700 bg-emerald-50/20">
                        {formatCurrency(row.tcvAop, filters.unit)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20">
                        {formatCurrency(row.tcvActual, filters.unit)}
                        <span className="block text-[10px] font-normal text-emerald-600">
                          {formatPercent(row.tcvAttainment)}
                        </span>
                      </td>
                      <td className={`py-3.5 px-3 text-right font-mono font-semibold bg-emerald-50/20 ${
                        row.tcvGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(row.tcvGap, filters.unit, true)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDealScope({
                              type: 'offering',
                              id: row.offeringId,
                              name: row.offeringName,
                              offeringNo: row.offeringNo,
                              owner: row.leadOwner,
                              dealCount: row.activeOpportunities
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-2xs ${
                            isOfferingSelected
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                              : 'bg-slate-200/90 hover:bg-blue-100 hover:text-blue-800 text-slate-800 border border-slate-300'
                          }`}
                          title="Click to view all deals for this offering in table below"
                        >
                          <Briefcase className="w-3 h-3" />
                          {row.activeOpportunities} Deals
                        </button>
                      </td>
                    </tr>

                    {/* Sub-Offering Child Rows (Visible when parent offering is expanded) */}
                    {isExpanded && row.subOfferings.map((sub) => {
                      const isSubSelected = selectedDealScope?.type === 'subOffering' && selectedDealScope?.id === sub.id;

                      return (
                        <tr
                          key={sub.id}
                          className={`transition-colors border-t border-slate-100 ${
                            isSubSelected
                              ? 'bg-blue-50/70'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {/* Solution offering column in child row: clean connector, no repeated text */}
                          <td className="py-2.5 px-4 pl-9">
                            <span className="text-slate-300 font-mono text-xs select-none">└─</span>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 text-xs pl-2.5 border-l-2 border-blue-500 py-0.5">
                              {sub.name}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-700 text-xs">{sub.owner}</div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 bg-blue-50/10">
                            {formatCurrency(sub.pipelineAop, filters.unit)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/10">
                            {formatCurrency(sub.pipelineActual, filters.unit)}
                            <span className="block text-[10px] font-normal text-blue-600">
                              {formatPercent(sub.pipelineAttainment)}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-medium bg-blue-50/10 ${
                            sub.pipelineGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {formatCurrency(sub.pipelineGap, filters.unit, true)}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 bg-emerald-50/10">
                            {formatCurrency(sub.tcvAop, filters.unit)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">
                            {formatCurrency(sub.tcvActual, filters.unit)}
                            <span className="block text-[10px] font-normal text-emerald-600">
                              {formatPercent(sub.tcvAttainment)}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-medium bg-emerald-50/10 ${
                            sub.tcvGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {formatCurrency(sub.tcvGap, filters.unit, true)}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectDealScope({
                                  type: 'subOffering',
                                  id: sub.id,
                                  name: sub.name,
                                  parentOfferingName: row.offeringName,
                                  owner: sub.owner,
                                  dealCount: sub.activeOpportunities
                                });
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all shadow-2xs ${
                                isSubSelected
                                  ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200'
                              }`}
                              title="Click to view deals for this sub-offering below"
                            >
                              <Briefcase className="w-2.5 h-2.5" />
                              {sub.activeOpportunities} Deals
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated Active Deals & Pursuit Intelligence Table (Triggered on Active Deals click) */}
      <div
        ref={dealsTableRef}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all scroll-mt-6"
      >
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Active Deals & Opportunity Details • {selectedRegion}
              </h3>
              {selectedDealScope && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Filtering by: {selectedDealScope.name}
                  <button
                    onClick={() => setSelectedDealScope(null)}
                    className="hover:text-blue-900 ml-1"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Granular pursuit roster with stage progression, win probability, deal value, and strategic next actions
            </p>
          </div>

          {/* Quick Filter & Search Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search account, deal, owner..."
                value={dealSearchTerm}
                onChange={(e) => setDealSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-60 text-slate-700 placeholder-slate-400"
              />
              {dealSearchTerm && (
                <button
                  onClick={() => setDealSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="All">All Stages</option>
              <option value="Stage 5">Stage 5 - Contract/SOW</option>
              <option value="Stage 4">Stage 4 - Negotiation</option>
              <option value="Stage 3">Stage 3 - Validation/POC</option>
              <option value="Stage 2">Stage 2 - Scoping</option>
            </select>

            {selectedDealScope && (
              <button
                onClick={() => setSelectedDealScope(null)}
                className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Show All Geo Deals
              </button>
            )}
          </div>
        </div>

        {/* Summary Metrics Bar for Filtered Deals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Deals in View</span>
            <span className="font-bold text-slate-900 text-sm">{filteredDeals.length}</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Pipeline Value</span>
            <span className="font-bold text-blue-700 text-sm">{formatCurrency(totalFilteredPipeline, filters.unit)}</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Projected TCV</span>
            <span className="font-bold text-emerald-700 text-sm">{formatCurrency(totalFilteredTcv, filters.unit)}</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Avg Win Probability</span>
            <span className="font-bold text-slate-800 text-sm">
              {filteredDeals.length > 0
                ? Math.round(filteredDeals.reduce((sum, d) => sum + d.winProbability, 0) / filteredDeals.length)
                : 0}%
            </span>
          </div>
        </div>

        {/* Deals Table */}
        <div className="overflow-x-auto">
          {filteredDeals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No active deals found matching the current criteria</p>
              <p className="text-slate-400 mt-1">Try resetting the stage filter or search term</p>
              <button
                onClick={() => {
                  setDealSearchTerm('');
                  setStageFilter('All');
                  setSelectedDealScope(null);
                }}
                className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold hover:bg-blue-100 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4 min-w-[200px]">Account & Deal Pursuit</th>
                  <th className="py-3 px-3 min-w-[130px]">Industry Vertical</th>
                  <th className="py-3 px-3 min-w-[170px]">Sub offering</th>
                  <th className="py-3 px-3 min-w-[90px]">Owner</th>
                  <th className="py-3 px-3 min-w-[160px]">Sales stage</th>
                  <th className="py-3 px-3 text-right bg-blue-50/50 min-w-[100px]">Est. Pipeline</th>
                  <th className="py-3 px-3 text-right bg-emerald-50/50 min-w-[100px]">Projected TCV</th>
                  <th className="py-3 px-3 min-w-[90px]">Target Close</th>
                  <th className="py-3 px-4 min-w-[240px]">Strategic Milestone / Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDeals.map((deal) => {
                  let stageBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (deal.winProbability >= 80) {
                    stageBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (deal.winProbability >= 60) {
                    stageBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  } else if (deal.winProbability >= 40) {
                    stageBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  }

                  return (
                    <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{deal.accountName}</div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {deal.dealName}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {deal.industry}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 text-xs">{deal.subOfferingName}</div>
                        <div className="text-[10px] text-indigo-600 font-medium">{deal.offeringName.split(':')[0]}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 text-xs">{deal.owner}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${stageBadgeClass}`}>
                            {deal.stage.split('-')[1] || deal.stage}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-600">
                            {deal.winProbability}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/10">
                        {formatCurrency(deal.pipelineValue, filters.unit)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">
                        {formatCurrency(deal.projectedTcv, filters.unit)}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {deal.expectedClose}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                          {deal.strategicMilestone}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
