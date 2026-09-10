import React, { useRef } from 'react';
import {
  Building2,
  Download,
  Upload,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  Film
} from 'lucide-react';
import { FilterOptions, QuarterType, Offering, RemedialAction } from '../types/dashboard';
import { formatCurrency, formatPercent, calculateExecutiveKPIs, exportToExcel } from '../utils/calculations';

interface HeaderProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  offerings: Offering[];
  actions: RemedialAction[];
  onOpenReportModal: () => void;
  onOpenVideoDemoModal?: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenAppBuilder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filters,
  setFilters,
  offerings,
  actions,
  onOpenReportModal,
  onOpenVideoDemoModal,
  onImportFile,
  onOpenAppBuilder
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kpis = calculateExecutiveKPIs(offerings, filters.region);

  const quarters: QuarterType[] = ['Q1 FY 27', 'Q2 FY 27', 'Q3 FY 27', 'Q4 FY 27', 'FY 27 Full Year'];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

          {/* Logo & Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10 shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Digital Thread Solutions - Business Health
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pipeline Health • Contract Value (TCV) Remediation • Operational Business Governance
              </p>
            </div>
          </div>

          {/* Quarter & Currency Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quarter Selector */}
            <div className="inline-flex items-center flex-nowrap whitespace-nowrap bg-slate-800/90 rounded-lg p-1 border border-slate-700/80">
              {quarters.map(q => (
                <button
                  key={q}
                  onClick={() => setFilters(prev => ({ ...prev, quarter: q }))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                    filters.quarter === q
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Currency Unit Toggle: Dollars ($) vs INR (₹) */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setFilters(prev => ({ ...prev, unit: 'M' }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  filters.unit === 'M' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="View values in USD ($ Dollars)"
              >
                $ USD (Dollars)
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, unit: 'INR_Cr' }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  filters.unit === 'INR_Cr' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="Convert & view in INR (₹ Indian Rupees)"
              >
                ₹ INR (Rupees)
              </button>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-2">
              <button onClick={onOpenAppBuilder} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg whitespace-nowrap">Excel to App</button>
              {onOpenVideoDemoModal && (
                <button
                  onClick={onOpenVideoDemoModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition shadow-sm border border-blue-400/30 ring-1 ring-white/20"
                  title="Watch 2-Minute Video Demo with Audio Walkthrough"
                >
                  <Film className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                  <span>▶ 2-Min Demo Video</span>
                </button>
              )}

              <button
                onClick={() => exportToExcel(offerings, actions)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-xs"
                title="Export workbook with exact Excel template columns"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Export XL</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onImportFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
                title="Upload updated Excel template"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>Import</span>
              </button>

              <button
                onClick={onOpenReportModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
                title="Executive Briefing View"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Exec Brief</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global KPI Ribbon: 5 Focused KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-800/80">

          {/* 1. Pipeline Planned (AOP) & Actual */}
          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Pipeline Planned vs Actual</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-white">
                {formatCurrency(kpis.totalPipelineActual, filters.unit)}
              </span>
              <span className="text-xs text-slate-400">
                / {formatCurrency(kpis.totalPipelineAop, filters.unit)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className={`font-semibold ${kpis.pipelineAttainment >= 90 ? 'text-emerald-400' : kpis.pipelineAttainment >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                {formatPercent(kpis.pipelineAttainment)} Attained
              </span>
              <span className="text-slate-400">Gap: {formatCurrency(kpis.pipelineGap, filters.unit, true)}</span>
            </div>
          </div>

          {/* 2. TCV Planned (AOP) & Actual */}
          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">TCV Planned vs Actual</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-emerald-400">
                {formatCurrency(kpis.totalTcvActual, filters.unit)}
              </span>
              <span className="text-xs text-slate-400">
                / {formatCurrency(kpis.totalTcvAop, filters.unit)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className={`font-semibold ${kpis.tcvAttainment >= 90 ? 'text-emerald-400' : kpis.tcvAttainment >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                {formatPercent(kpis.tcvAttainment)} Attained
              </span>
              <span className="text-slate-400">Gap: {formatCurrency(kpis.tcvGap, filters.unit, true)}</span>
            </div>
          </div>

          {/* 3. Revenue Planned (AOP) & Actual */}
          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Revenue Planned vs Actual</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-indigo-400">
                {formatCurrency(kpis.totalRevenueActual, filters.unit)}
              </span>
              <span className="text-xs text-slate-400">
                / {formatCurrency(kpis.totalRevenueAop, filters.unit)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className={`font-semibold ${kpis.revenueAttainment >= 90 ? 'text-emerald-400' : kpis.revenueAttainment >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                {formatPercent(kpis.revenueAttainment)} Attained
              </span>
              <span className="text-slate-400">Gap: {formatCurrency(kpis.revenueGap, filters.unit, true)}</span>
            </div>
          </div>

          {/* 4. Coverage Ratios (Pipeline:TCV, TCV:Revenue, Pipeline:Revenue) */}
          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Coverage Ratios</span>
            <div className="mt-0.5 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300">Pipe : TCV</span>
                <span className="text-xs font-bold text-white">{kpis.coverageRatio}x <span className="text-[9px] text-slate-400 font-normal">(&gt;3x)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300">TCV : Rev</span>
                <span className="text-xs font-bold text-emerald-300">{kpis.tcvToRevenueCoverage}x <span className="text-[9px] text-slate-400 font-normal">(2x)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300">Rev : Pipe</span>
                <span className="text-xs font-bold text-indigo-300">
                  {kpis.revenueToPipelineFactor}x <span className="text-[9px] text-indigo-300/80 font-normal">(Tgt 8x)</span>
                </span>
              </div>
            </div>
          </div>

          {/* 5. Net Deficits Summary */}
          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Net Gaps vs Target</span>
            <div className="mt-0.5 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Pipeline:</span>
                <span className={`font-mono font-semibold ${kpis.pipelineGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(kpis.pipelineGap, filters.unit, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TCV:</span>
                <span className={`font-mono font-semibold ${kpis.tcvGap >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatCurrency(kpis.tcvGap, filters.unit, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Revenue:</span>
                <span className={`font-mono font-semibold ${kpis.revenueGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(kpis.revenueGap, filters.unit, true)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
