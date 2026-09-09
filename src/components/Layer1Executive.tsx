import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  ArrowUpRight,
  SlidersHorizontal,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Target,
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  X,
  CreditCard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { Offering, SubOffering, FilterOptions, RemedialAction } from '../types/dashboard';
import {
  formatCurrency,
  formatPercent,
  getStatusBadgeConfig,
  stripBrackets,
  USD_TO_INR_CR,
  calculateOfferingRollup
} from '../utils/calculations';
import { matchesSubFilters } from '../utils/dataIntegrity';
import { CustomMultiLineTick } from './CustomMultiLineTick';

interface Layer1ExecutiveProps {
  offerings: Offering[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  actions: RemedialAction[];
  onEditSubOffering: (offeringId: number, subOffering: SubOffering) => void;
  onViewSubOffering: (offeringId: number, subOffering: SubOffering) => void;
  onQuickAction: (offering: Offering, subOffering?: SubOffering, type?: 'Pipeline' | 'TCV' | 'Revenue') => void;
  onOpenNewActionModal: (type?: 'Pipeline' | 'TCV' | 'Revenue') => void;
  onResetData: () => void;
}

export const Layer1Executive: React.FC<Layer1ExecutiveProps> = ({
  offerings,
  filters,
  setFilters,
  actions,
  onEditSubOffering,
  onViewSubOffering,
  onQuickAction,
  onOpenNewActionModal,
  onResetData
}) => {
  const [expandedOfferings, setExpandedOfferings] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true
  });

  const [pipelineChartView, setPipelineChartView] = useState<'volume' | 'attainment'>('volume');
  const [tcvChartView, setTcvChartView] = useState<'volume' | 'attainment'>('volume');
  const [revenueChartView, setRevenueChartView] = useState<'volume' | 'attainment'>('volume');

  const toggleOffering = (id: number) => {
    setExpandedOfferings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Distinct list of all sub-offering owners for the filter dropdown
  const allOwners: string[] = useMemo(() => {
    const set = new Set<string>();
    offerings.forEach(o => {
      if (o.leadOwner) set.add(stripBrackets(o.leadOwner).trim());
      o.subOfferings.forEach(s => {
        if (s.owner) set.add(stripBrackets(s.owner).trim());
      });
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [offerings]);

  const hasActiveFilters = Boolean(
    filters.searchQuery || filters.offeringId !== 'All' || filters.owner !== 'All' || filters.statusFilter !== 'All'
  );

  const normalizeStr = (s?: string) => (s ? stripBrackets(s).trim().toLowerCase() : '');

  // Filtered offerings and filtered sub-offerings (strictly displaying rows belonging to selected owner)
  const filteredOfferingsData = useMemo(() => {
    const selectedOwnerNorm = filters.owner !== 'All' ? normalizeStr(filters.owner) : '';

    return offerings.map(off => {
      // Check offering ID filter
      if (filters.offeringId !== 'All' && off.id !== filters.offeringId) {
        return null;
      }

      const leadOwnerNorm = normalizeStr(off.leadOwner);
      const isLeadSelected = selectedOwnerNorm && leadOwnerNorm === selectedOwnerNorm;

      // Filter sub-offerings of this offering
      const visibleSubOfferings = off.subOfferings.filter(sub => matchesSubFilters(off, sub, filters));

      // If no sub-offerings match, skip offering
      if (visibleSubOfferings.length === 0) {
        return null;
      }

      // Compute dynamic rollups for the filtered visible sub-offerings
      const rollup = calculateOfferingRollup(visibleSubOfferings);

      return {
        ...off,
        subOfferings: visibleSubOfferings,
        pipelineAop: rollup.pipelineAop,
        pipelineActual: rollup.pipelineActual,
        pipelineGap: rollup.pipelineGap,
        pipelineAttainment: rollup.pipelineAttainment,
        tcvAop: rollup.tcvAop,
        tcvActual: rollup.tcvActual,
        tcvGap: rollup.tcvGap,
        tcvAttainment: rollup.tcvAttainment,
        revenueAop: rollup.revenueAop,
        revenueActual: rollup.revenueActual,
        revenueGap: rollup.revenueGap,
        revenueAttainment: rollup.revenueAttainment,
        status: rollup.status
      };
    }).filter((x): x is Offering => x !== null);
  }, [offerings, filters]);

  // Chart Data preparation with human-readable concise names
  const isINR = filters.unit === 'INR_Cr';
  const multiplier = isINR ? USD_TO_INR_CR : 1;
  const unitLabel = isINR ? '₹ Cr' : '$M';

  const chartData = offerings.map(off => {
    const cleanFullName = stripBrackets(off.name);

    return {
      name: cleanFullName,
      fullName: `Offering ${off.no}: ${cleanFullName}`,
      // Pipeline
      pipelineAopRaw: off.pipelineAop,
      pipelineActualRaw: off.pipelineActual,
      pipelineAop: Number((off.pipelineAop * multiplier).toFixed(1)),
      pipelineActual: Number((off.pipelineActual * multiplier).toFixed(1)),
      pipelineGap: Number((off.pipelineGap * multiplier).toFixed(1)),
      pipelineAttainment: off.pipelineAttainment,
      // TCV
      tcvAopRaw: off.tcvAop,
      tcvActualRaw: off.tcvActual,
      tcvAop: Number((off.tcvAop * multiplier).toFixed(1)),
      tcvActual: Number((off.tcvActual * multiplier).toFixed(1)),
      tcvGap: Number((off.tcvGap * multiplier).toFixed(1)),
      tcvAttainment: off.tcvAttainment,
      // Revenue
      revenueAopRaw: off.revenueAop ?? (off.tcvAop / 2),
      revenueActualRaw: off.revenueActual ?? (off.tcvActual / 2),
      revenueAop: Number(((off.revenueAop ?? (off.tcvAop / 2)) * multiplier).toFixed(1)),
      revenueActual: Number(((off.revenueActual ?? (off.tcvActual / 2)) * multiplier).toFixed(1)),
      revenueGap: Number(((off.revenueGap ?? ((off.revenueActual ?? 0) - (off.revenueAop ?? 0))) * multiplier).toFixed(1)),
      revenueAttainment: off.revenueAttainment ?? (off.revenueAop ? Number((((off.revenueActual ?? 0) / off.revenueAop) * 100).toFixed(1)) : 0)
    };
  });

  // Calculate grand totals for graphs (AOP = Planned targets)
  const totalPlannedPipeline = offerings.reduce((sum, o) => sum + o.pipelineAop, 0);
  const totalActualPipeline = offerings.reduce((sum, o) => sum + o.pipelineActual, 0);
  const totalPipelineGap = Number((totalActualPipeline - totalPlannedPipeline).toFixed(2));
  const totalPipelineAttainment = totalPlannedPipeline > 0 ? Number(((totalActualPipeline / totalPlannedPipeline) * 100).toFixed(1)) : 0;

  const totalPlannedTcv = offerings.reduce((sum, o) => sum + o.tcvAop, 0);
  const totalActualTcv = offerings.reduce((sum, o) => sum + o.tcvActual, 0);
  const totalTcvGap = Number((totalActualTcv - totalPlannedTcv).toFixed(2));
  const totalTcvAttainment = totalPlannedTcv > 0 ? Number(((totalActualTcv / totalPlannedTcv) * 100).toFixed(1)) : 0;

  const totalPlannedRevenue = offerings.reduce((sum, o) => sum + (o.revenueAop ?? (o.tcvAop / 2)), 0);
  const totalActualRevenue = offerings.reduce((sum, o) => sum + (o.revenueActual ?? (o.tcvActual / 2)), 0);
  const totalRevenueGap = Number((totalActualRevenue - totalPlannedRevenue).toFixed(2));
  const totalRevenueAttainment = totalPlannedRevenue > 0 ? Number(((totalActualRevenue / totalPlannedRevenue) * 100).toFixed(1)) : 0;

  // Coverage ratios
  const pipeToTcvRatio = totalActualTcv > 0 ? (totalActualPipeline / totalActualTcv).toFixed(2) : '0.00';
  const tcvToRevRatio = totalActualRevenue > 0 ? (totalActualTcv / totalActualRevenue).toFixed(2) : '2.00';
  const pipeToRevRatio = totalActualRevenue > 0 ? (totalActualPipeline / totalActualRevenue).toFixed(2) : '0.00';
  const revToPipeRatio = totalActualPipeline > 0 ? (totalActualRevenue / totalActualPipeline).toFixed(2) : '0.00';

  // Grid activation: only active when offering filter, owner filter, health filter, or search is selected
  const isFilterActive = Boolean(
    (filters.offeringId !== 'All') ||
    (filters.owner !== 'All') ||
    (filters.statusFilter !== 'All') ||
    (filters.searchQuery?.trim().length > 0)
  );

  return (
    <div className="space-y-6 pb-12">

      {/* Visual Analytics: 3 Distinct Graphs for Pipeline, TCV, and Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* GRAPH 1: Dedicated Pipeline Performance Chart */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Pipeline Performance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Planned vs Actual • {filters.quarter}
                  </p>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setPipelineChartView('volume')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    pipelineChartView === 'volume' ? 'bg-white shadow-xs text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {unitLabel}
                </button>
                <button
                  onClick={() => setPipelineChartView('attainment')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    pipelineChartView === 'attainment' ? 'bg-white shadow-xs text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Attain %
                </button>
              </div>
            </div>

            {/* Pipeline Summary Metrics Banner */}
            <div className="grid grid-cols-4 gap-1.5 mb-2.5 p-2 bg-blue-50/60 rounded-lg border border-blue-100 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Planned</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{formatCurrency(totalPlannedPipeline, filters.unit)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Actual</span>
                <span className="font-bold text-blue-700 font-mono text-[11px]">{formatCurrency(totalActualPipeline, filters.unit)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Gap</span>
                <span className={`font-bold font-mono text-[11px] ${totalPipelineGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(totalPipelineGap, filters.unit, true)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Attain</span>
                <span className="font-bold text-slate-900 font-mono text-[11px]">{formatPercent(totalPipelineAttainment)}</span>
              </div>
            </div>

            {/* Pipeline Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {pipelineChartView === 'volume' ? (
                  <BarChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={<CustomMultiLineTick maxChars={12} fontSize={8} lineHeight={10} />}
                      interval={0}
                      height={55}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      unit={filters.unit === 'INR_Cr' ? ' Cr' : 'M'}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${filters.unit === 'INR_Cr' ? '₹' : '$'}${Number(value).toFixed(1)}${filters.unit === 'INR_Cr' ? ' Cr' : 'M'}`, '']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '10.5px' }} />
                    <Bar dataKey="pipelineAop" name="Planned (AOP)" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="pipelineActual" name="Actual Attained" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={26} />
                  </BarChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={<CustomMultiLineTick maxChars={12} fontSize={8} lineHeight={10} />}
                      interval={0}
                      height={55}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" domain={[0, 115]} />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toFixed(1)}% Attainment`, '']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '10.5px' }} />
                    <Bar dataKey="pipelineAttainment" name="Pipeline Attainment %" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-p-${index}`}
                          fill={entry.pipelineAttainment >= 90 ? '#10b981' : entry.pipelineAttainment >= 75 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRAPH 2: Dedicated Total Contract Value (TCV) Performance Chart */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Total Contract Value (TCV) Performance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Planned vs Actual • {filters.quarter}
                  </p>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setTcvChartView('volume')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    tcvChartView === 'volume' ? 'bg-white shadow-xs text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {unitLabel}
                </button>
                <button
                  onClick={() => setTcvChartView('attainment')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    tcvChartView === 'attainment' ? 'bg-white shadow-xs text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Attain %
                </button>
              </div>
            </div>

            {/* TCV Summary Metrics Banner */}
            <div className="grid grid-cols-4 gap-1.5 mb-2.5 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Planned</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{formatCurrency(totalPlannedTcv, filters.unit)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Actual</span>
                <span className="font-bold text-emerald-700 font-mono text-[11px]">{formatCurrency(totalActualTcv, filters.unit)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Gap</span>
                <span className={`font-bold font-mono text-[11px] ${totalTcvGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(totalTcvGap, filters.unit, true)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Attain</span>
                <span className="font-bold text-slate-900 font-mono text-[11px]">{formatPercent(totalTcvAttainment)}</span>
              </div>
            </div>

            {/* TCV Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {tcvChartView === 'volume' ? (
                  <BarChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={<CustomMultiLineTick maxChars={12} fontSize={8} lineHeight={10} />}
                      interval={0}
                      height={55}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      unit={filters.unit === 'INR_Cr' ? ' Cr' : 'M'}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${filters.unit === 'INR_Cr' ? '₹' : '$'}${Number(value).toFixed(1)}${filters.unit === 'INR_Cr' ? ' Cr' : 'M'}`, '']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '10.5px' }} />
                    <Bar dataKey="tcvAop" name="Planned (AOP)" fill="#cbd5e1" radius={[3, 3, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="tcvActual" name="Actual Booked" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={26} />
                  </BarChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={<CustomMultiLineTick maxChars={12} fontSize={8} lineHeight={10} />}
                      interval={0}
                      height={55}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" domain={[0, 115]} />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toFixed(1)}% Attainment`, '']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '10.5px' }} />
                    <Bar dataKey="tcvAttainment" name="TCV Attainment %" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-t-${index}`}
                          fill={entry.tcvAttainment >= 90 ? '#10b981' : entry.tcvAttainment >= 75 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRAPH 3: Dedicated Revenue Performance Chart */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Revenue Performance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Planned vs Actual • {filters.quarter}
                  </p>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setRevenueChartView('volume')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    revenueChartView === 'volume' ? 'bg-white shadow-xs text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {unitLabel}
                </button>
                <button
                  onClick={() => setRevenueChartView('attainment')}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    revenueChartView === 'attainment' ? 'bg-white shadow-xs text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Attain %
                </button>
              </div>
            </div>

            {/* Revenue Summary Metrics Banner */}
            <div className="grid grid-cols-4 gap-1.5 mb-2.5 p-2 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Planned</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{formatCurrency(totalPlannedRevenue, filters.unit)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Actual</span>
                <span className="font-bold text-indigo-700 font-mono text-[11px]">{formatCurrency(totalActualRevenue, filters.unit)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Gap</span>
                <span className={`font-bold font-mono text-[11px] ${totalRevenueGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(totalRevenueGap, filters.unit, true)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-medium">Attain</span>
                <span className="font-bold text-slate-900 font-mono text-[11px]">{formatPercent(totalRevenueAttainment)}</span>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {revenueChartView === 'volume' ? (
                  <BarChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={<CustomMultiLineTick maxChars={12} fontSize={8} lineHeight={10} />}
                      interval={0}
                      height={55}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      unit={filters.unit === 'INR_Cr' ? ' Cr' : 'M'}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${filters.unit === 'INR_Cr' ? '₹' : '$'}${Number(value).toFixed(1)}${filters.unit === 'INR_Cr' ? ' Cr' : 'M'}`, '']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '10.5px' }} />
                    <Bar dataKey="revenueAop" name="Planned (AOP)" fill="#cbd5e1" radius={[3, 3, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="revenueActual" name="Actual Realized" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={26} />
                  </BarChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={<CustomMultiLineTick maxChars={12} fontSize={8} lineHeight={10} />}
                      interval={0}
                      height={55}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" domain={[0, 115]} />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toFixed(1)}% Attainment`, '']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '10.5px' }} />
                    <Bar dataKey="revenueAttainment" name="Revenue Attainment %" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-r-${index}`}
                          fill={entry.revenueAttainment >= 90 ? '#10b981' : entry.revenueAttainment >= 75 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Coverage Ratios & Strategic Insight Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-xl p-3.5 text-white shadow-xs border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Coverage Ratios & Governance Health
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                TCV Target = 2x Revenue
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Revenue Benchmark = 8x Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pipeline to TCV health: <strong className="text-white">{pipeToTcvRatio}x</strong> (target &gt;3.0x) • TCV to Revenue conversion: <strong className="text-emerald-300">{tcvToRevRatio}x</strong> (target 2.0x) • Pipeline to Revenue factor: <strong className="text-indigo-300">{pipeToRevRatio}x</strong> (Rev : Pipe multiplier: <strong className="text-indigo-300">{revToPipeRatio}x</strong>, Target 8.0x)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0 self-end lg:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Net Revenue Target</span>
            <span className="font-bold text-white font-mono">{formatCurrency(totalPlannedRevenue, filters.unit)}</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Net TCV Target</span>
            <span className="font-bold text-emerald-400 font-mono">{formatCurrency(totalPlannedTcv, filters.unit)}</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Net Pipeline Target</span>
            <span className="font-bold text-blue-400 font-mono">{formatCurrency(totalPlannedPipeline, filters.unit)}</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER RIBBON */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">

          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search offering, sub-offering, owner, action..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* Offering Selector Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium whitespace-nowrap">Offering:</span>
              <select
                value={filters.offeringId}
                onChange={e => setFilters(prev => ({ ...prev, offeringId: e.target.value === 'All' ? 'All' : Number(e.target.value) }))}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="All">All 4 Solution Offerings</option>
                {offerings.map(o => (
                  <option key={o.id} value={o.id}>{o.no}. {stripBrackets(o.name)}</option>
                ))}
              </select>
            </div>

            {/* Owner Selector Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium whitespace-nowrap">Owner:</span>
              <select
                value={filters.owner}
                onChange={e => setFilters(prev => ({ ...prev, owner: e.target.value }))}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="All">All Owners</option>
                {allOwners.map(owner => (
                  <option key={owner} value={owner}>{stripBrackets(owner)}</option>
                ))}
              </select>
            </div>

            {/* Status Health Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium whitespace-nowrap">Health:</span>
              <select
                value={filters.statusFilter}
                onChange={e => setFilters(prev => ({ ...prev, statusFilter: e.target.value as any }))}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Surplus">Surplus (100%+)</option>
                <option value="On Track">On Track (90-99%)</option>
                <option value="Moderate Gap">Moderate Gap (75-89%)</option>
                <option value="Critical Gap">Critical Gap (&lt;75%)</option>
              </select>
            </div>

            {/* Currency Toggle: Dollars ($) vs INR (₹) */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-300 text-xs">
              <button
                onClick={() => setFilters(prev => ({ ...prev, unit: 'M' }))}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  filters.unit === 'M' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View metrics in Dollars ($M USD)"
              >
                $ USD (Dollars)
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, unit: 'INR_Cr' }))}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  filters.unit === 'INR_Cr' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View metrics in Indian Rupees (₹ Cr INR)"
              >
                ₹ INR (Rupees)
              </button>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            {hasActiveFilters && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '', offeringId: 'All', owner: 'All', statusFilter: 'All' }))}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}

            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
              title="Reset data to initial Excel template defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>
      </div>

      {/* Granular Master Table (Offering & Sub-Offering Hierarchy) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Table Header Controls */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Solution Offerings Master Performance Grid
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive analysis of Pipeline, TCV, and Revenue Planned (AOP) vs Actual with Pipeline, TCV, and Revenue Gaps
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* Quick Status Legend */}
            <div className="text-xs text-slate-500 hidden xl:flex items-center gap-3 mr-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Surplus / On Track</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate Gap</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Critical Gap</span>
            </div>

            {/* LOG ACTION BUTTON */}
            <button
              onClick={() => onOpenNewActionModal('TCV')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm"
              title="Log a new remediation action item"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Action</span>
            </button>
          </div>
        </div>

        {/* Responsive Master Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1240px]">
            <thead>
              {/* Main Column Headers */}
              <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-2.5 w-12 text-center text-slate-700 font-semibold">
                  No
                </th>
                <th className="py-3 px-3 min-w-[220px] text-left text-slate-700 font-semibold">
                  Offering / Sub-offering
                </th>
                <th className="py-3 px-3 min-w-[120px] text-left text-slate-700 font-semibold">
                  Owner
                </th>
                <th className="py-3 px-2.5 min-w-[85px] text-center whitespace-nowrap text-slate-700 font-semibold">
                  Quarter
                </th>

                {/* Pipeline Block (Blue) */}
                <th className="py-3 px-2.5 text-right bg-blue-50/80 border-l border-slate-200 min-w-[95px] text-blue-900 font-semibold whitespace-nowrap">
                  Pipe Planned
                </th>
                <th className="py-3 px-2.5 text-right bg-blue-50/80 min-w-[95px] text-blue-900 font-semibold whitespace-nowrap">
                  Pipe Actual
                </th>

                <th className="py-3 px-2.5 text-right bg-blue-50/80 text-blue-900 whitespace-nowrap">Pipeline Gap</th>
                {/* TCV Block (Emerald) */}
                <th className="py-3 px-2.5 text-right bg-emerald-50/80 border-l border-slate-200 min-w-[95px] text-emerald-900 font-semibold whitespace-nowrap">
                  TCV Planned
                </th>
                <th className="py-3 px-2.5 text-right bg-emerald-50/80 min-w-[95px] text-emerald-900 font-semibold whitespace-nowrap">
                  TCV Actual
                </th>
                <th className="py-3 px-2.5 text-right bg-emerald-50/80 min-w-[90px] text-emerald-900 font-semibold whitespace-nowrap">
                  TCV Gap
                </th>

                {/* Revenue Block (Indigo) */}
                <th className="py-3 px-2.5 text-right bg-indigo-50/80 border-l border-slate-200 min-w-[95px] text-indigo-900 font-semibold whitespace-nowrap">
                  Rev Planned
                </th>
                <th className="py-3 px-2.5 text-right bg-indigo-50/80 min-w-[95px] text-indigo-900 font-semibold whitespace-nowrap">
                  Rev Actual
                </th>
                <th className="py-3 px-2.5 text-right bg-indigo-50/80 min-w-[90px] text-indigo-900 font-semibold whitespace-nowrap">
                  Rev Gap
                </th>

                {/* Health Column */}
                <th className="py-3 px-2.5 text-center border-l border-slate-200 min-w-[105px] text-slate-700 font-semibold whitespace-nowrap">
                  Health
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredOfferingsData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500 bg-slate-50/30">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-2">
                      <p className="font-semibold text-sm text-slate-700">No solution offerings match the current filter criteria.</p>
                      <p className="text-xs text-slate-500">Try choosing a different owner, health status, or clearing the search bar.</p>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, searchQuery: '', offeringId: 'All', owner: 'All', statusFilter: 'All' }))}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOfferingsData.map((offering, offeringIndex) => {
                  const isExpanded = hasActiveFilters || !!expandedOfferings[offering.id];
                  const statusBadge = getStatusBadgeConfig(offering.status);
                  const cleanOfferingName = stripBrackets(offering.name);

                  // Requirement: Colour strip the first two rows if the TCV value is greater than 10 MN USD
                  const isHighTcvRow = offeringIndex < 2 && (offering.tcvActual > 10 || offering.tcvAop > 10);

                  return (
                    <React.Fragment key={offering.id}>
                      {/* Offering Summary Parent Row */}
                      <tr className={`font-semibold text-slate-900 transition-colors border-t-2 border-slate-200 ${
                        isHighTcvRow
                          ? 'border-l-[6px] border-l-amber-500 bg-amber-50/60 hover:bg-amber-100/70'
                          : 'bg-slate-50/95 hover:bg-slate-100'
                      }`}>
                        <td className="py-2.5 px-2.5 text-center font-bold text-blue-700">
                          {offering.no}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => toggleOffering(offering.id)}
                            className="flex items-center gap-1.5 text-left font-bold text-slate-900 hover:text-blue-600 transition"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-xs">{cleanOfferingName}</span>
                            <span className="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {offering.subOfferings.length}
                            </span>
                            {isHighTcvRow && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-200/80 text-amber-950 border border-amber-300 whitespace-nowrap">
                                ⚡ TCV &gt; $10M
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="font-medium">
                            {filters.owner !== 'All' ? stripBrackets(filters.owner) : stripBrackets(offering.leadOwner)}
                          </span>
                          <span className="block text-[9px] text-slate-400">
                            {filters.owner !== 'All'
                              ? (normalizeStr(offering.leadOwner) === normalizeStr(filters.owner) ? 'Practice Lead' : 'Offering Owner')
                              : 'Practice Lead'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center text-slate-600 text-[11px] whitespace-nowrap font-medium">
                          {offering.quarter}
                        </td>

                        {/* Pipeline Rollup */}
                        <td className="py-2.5 px-2.5 text-right bg-blue-50/30 border-l border-slate-200 font-mono text-slate-700 text-[11px]">
                          {formatCurrency(offering.pipelineAop, filters.unit)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right bg-blue-50/30 font-mono font-bold text-blue-800 text-[11px]">
                          {formatCurrency(offering.pipelineActual, filters.unit)}
                          <span className="block text-[9px] font-normal text-blue-600">
                            {formatPercent(offering.pipelineAttainment)}
                          </span>
                        </td>

                        <td className="py-2.5 px-2.5 text-right bg-blue-50/30 font-mono"><span className={offering.pipelineGap < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(offering.pipelineGap, filters.unit, true)}</span></td>
                        {/* TCV Rollup */}
                        <td className={`py-2.5 px-2.5 text-right border-l border-slate-200 font-mono text-slate-700 text-[11px] ${
                          isHighTcvRow ? 'bg-amber-100/40 font-bold' : 'bg-emerald-50/30'
                        }`}>
                          {formatCurrency(offering.tcvAop, filters.unit)}
                        </td>
                        <td className={`py-2.5 px-2.5 text-right font-mono font-bold text-[11px] ${
                          isHighTcvRow ? 'bg-amber-100/50 text-amber-950' : 'bg-emerald-50/30 text-emerald-800'
                        }`}>
                          {formatCurrency(offering.tcvActual, filters.unit)}
                          <span className={`block text-[9px] font-normal ${isHighTcvRow ? 'text-amber-800' : 'text-emerald-600'}`}>
                            {formatPercent(offering.tcvAttainment)}
                          </span>
                        </td>
                        <td className={`py-2.5 px-2.5 text-right font-mono font-bold text-[11px] ${
                          isHighTcvRow ? 'bg-amber-100/40' : 'bg-emerald-50/30'
                        } ${
                          offering.tcvGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(offering.tcvGap, filters.unit, true)}
                        </td>

                        {/* Revenue Rollup */}
                        <td className="py-2.5 px-2.5 text-right bg-indigo-50/30 border-l border-slate-200 font-mono text-slate-700 text-[11px]">
                          {formatCurrency(offering.revenueAop, filters.unit)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right bg-indigo-50/30 font-mono font-bold text-indigo-800 text-[11px]">
                          {formatCurrency(offering.revenueActual, filters.unit)}
                          <span className="block text-[9px] font-normal text-indigo-600">
                            {formatPercent(offering.revenueAttainment)}
                          </span>
                        </td>
                        <td className={`py-2.5 px-2.5 text-right bg-indigo-50/30 font-mono font-bold text-[11px] ${
                          offering.revenueGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(offering.revenueGap, filters.unit, true)}
                        </td>

                        {/* Offering Actions / Status */}
                        <td className="py-2.5 px-2.5 text-center border-l border-slate-200">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${statusBadge.dot}`} />
                              {offering.status}
                            </span>
                            <button
                              onClick={() => onQuickAction(offering, undefined, 'Pipeline')}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-0.5"
                            >
                              <span>+ Pipeline Action</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-Offerings Child Rows */}
                      {isExpanded && offering.subOfferings.map((sub) => {
                        const cleanSubName = stripBrackets(sub.name);
                        const isSubHighTcv = (sub.tcvAop > 10 || sub.tcvActual > 10);
                        const subRevAop = sub.revenueAop ?? (sub.tcvAop / 2);
                        const subRevActual = sub.revenueActual ?? (sub.tcvActual / 2);
                        const subRevGap = sub.revenueGap ?? Number((subRevActual - subRevAop).toFixed(2));

                        return (
                          <tr
                            key={sub.id}
                            className={`transition-colors ${
                              isSubHighTcv
                                ? 'border-l-[4px] border-l-amber-400 bg-amber-50/20 hover:bg-amber-100/40'
                                : 'bg-white hover:bg-blue-50/30'
                            }`}
                          >
                            <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[10px]">
                              {sub.no}
                            </td>
                            <td className="py-2 px-3 pl-6">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                                <span className="font-medium text-slate-900 text-xs">{cleanSubName}</span>
                                {sub.mapping && <span className="text-[10px] text-blue-800 bg-blue-50 rounded px-1" title={`Source: ${sub.mapping.sourceOffering} / ${sub.mapping.sourceSubOffering}, ${sub.mapping.sourceSheet} row ${sub.mapping.sourceRow}`}>{sub.mapping.relationship}: {sub.mapping.updatedOffering}</span>}
                                {isSubHighTcv && (
                                  <span className="inline-flex items-center text-[9px] font-semibold text-amber-800 bg-amber-100 px-1 py-0.2 rounded border border-amber-300 whitespace-nowrap">
                                    TCV &gt; $10M
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-3 mt-0.5">
                                <span>Win: <strong>{sub.winRate}%</strong></span>
                                <span>•</span>
                                <span>Deals: <strong>{sub.dealCount}</strong></span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-slate-800 font-medium text-xs">
                              {stripBrackets(sub.owner)}
                            </td>
                            <td className="py-2 px-2.5 text-center text-slate-500 text-[10px] whitespace-nowrap">
                              {sub.quarter}
                            </td>

                            {/* Sub Pipeline */}
                            <td className="py-2 px-2.5 text-right bg-blue-50/15 border-l border-slate-100 font-mono text-slate-600 text-[11px]">
                              {formatCurrency(sub.pipelineAop, filters.unit)}
                            </td>
                            <td className="py-2 px-2.5 text-right bg-blue-50/15 font-mono text-slate-900 font-semibold text-[11px]">
                              {formatCurrency(sub.pipelineActual, filters.unit)}
                              <div className="w-12 ml-auto h-1 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${sub.pipelineAttainment >= 90 ? 'bg-emerald-500' : sub.pipelineAttainment >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(sub.pipelineAttainment, 100)}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-2 px-2.5 text-right bg-blue-50/15 font-mono"><span className={sub.pipelineGap < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(sub.pipelineGap, filters.unit, true)}</span></td>
                            {/* Sub TCV */}
                            <td className="py-2 px-2.5 text-right bg-emerald-50/15 border-l border-slate-100 font-mono text-slate-600 text-[11px]">
                              {formatCurrency(sub.tcvAop, filters.unit)}
                            </td>
                            <td className="py-2 px-2.5 text-right bg-emerald-50/15 font-mono text-slate-900 font-semibold text-[11px]">
                              {formatCurrency(sub.tcvActual, filters.unit)}
                              <div className="w-12 ml-auto h-1 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${sub.tcvAttainment >= 90 ? 'bg-emerald-500' : sub.tcvAttainment >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(sub.tcvAttainment, 100)}%` }}
                                />
                              </div>
                            </td>
                            <td className={`py-2 px-2.5 text-right bg-emerald-50/15 font-mono font-medium text-[11px] ${
                              sub.tcvGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {formatCurrency(sub.tcvGap, filters.unit, true)}
                            </td>

                            {/* Sub Revenue */}
                            <td className="py-2 px-2.5 text-right bg-indigo-50/15 border-l border-slate-100 font-mono text-slate-600 text-[11px]">
                              {formatCurrency(subRevAop, filters.unit)}
                            </td>
                            <td className="py-2 px-2.5 text-right bg-indigo-50/15 font-mono text-slate-900 font-semibold text-[11px]">
                              {formatCurrency(subRevActual, filters.unit)}
                              <div className="w-12 ml-auto h-1 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${(sub.revenueAttainment ?? 0) >= 90 ? 'bg-emerald-500' : (sub.revenueAttainment ?? 0) >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(sub.revenueAttainment ?? 0, 100)}%` }}
                                />
                              </div>
                            </td>
                            <td className={`py-2 px-2.5 text-right bg-indigo-50/15 font-mono font-medium text-[11px] ${
                              subRevGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {formatCurrency(subRevGap, filters.unit, true)}
                            </td>

                            {/* Sub Row Actions */}
                            <td className="py-2 px-2.5 text-center border-l border-slate-100">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => onQuickAction(offering, sub, 'Pipeline')} title="Add pipeline action for this sub-offering" className="p-1 text-blue-600"><PlusCircle className="w-3.5 h-3.5" /></button>
                                <button
                                  onClick={() => onViewSubOffering(offering.id, sub)}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                  title="View sub-offering details & regional split"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onEditSubOffering(offering.id, sub)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                  title="Edit Planned (AOP) / Actual numbers"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
