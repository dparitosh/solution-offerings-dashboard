import React from 'react';
import { createPortal } from 'react-dom';
import { buildExecutiveSummary, priorityActions } from '../utils/executiveBrief';
import { X, Printer, Copy, Check, FileText, Download, Building, Target, Layers } from 'lucide-react';
import { Offering, RemedialAction, FilterOptions } from '../types/dashboard';
import { calculateExecutiveKPIs, calculateOwnerPerformances, formatCurrency, formatPercent } from '../utils/calculations';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerings: Offering[];
  actions: RemedialAction[];
  filters: FilterOptions;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  offerings,
  actions,
  filters
}) => {
  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState('');
  React.useEffect(() => { setCopied(false); setCopyError(''); }, [isOpen, filters.quarter, filters.unit]);

  if (!isOpen) return null;

  const kpis = calculateExecutiveKPIs(offerings);
  const owners = calculateOwnerPerformances(offerings, actions);
  const criticalSubOfferings = offerings.flatMap(o => o.subOfferings).filter(s => s.status === 'Critical Gap');
  const onTrackSubOfferings = offerings.flatMap(o => o.subOfferings).filter(s => s.status === 'On Track' || s.status === 'Surplus');

  const initiatives = priorityActions(actions);
  const reportText = buildExecutiveSummary(offerings, actions, filters);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setCopyError('');
    } catch {
      setCopyError('Clipboard access is unavailable. Use Download Summary instead.');
    }
  };
  const downloadSummary = () => {
    const url = URL.createObjectURL(new Blob([reportText], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Executive_Brief_${filters.quarter.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Executive brief" className="executive-report-overlay fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="executive-report-sheet bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">

        {/* Header */}
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Executive Dashboard Briefing Snapshot ({filters.quarter})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>

            <button onClick={downloadSummary} className="px-3 py-1.5 text-xs font-semibold bg-slate-800 rounded-lg">Download Summary</button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brief</span>
            </button>

            <button
              aria-label="Close executive brief"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {copyError && <p role="alert" className="print:hidden px-6 py-2 text-xs text-rose-700">{copyError}</p>}
        {/* Report Content */}
        <div className="executive-report-content p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none text-slate-900">

          {/* Executive Header */}
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Solution Offerings Pipeline & TCV Governance Report
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Full-quarter portfolio brief (all offerings and regions) • Reporting Period: {filters.quarter} • Currency: {filters.unit === 'INR_Cr' ? 'INR (₹ Cr)' : 'USD ($M)'} • Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Core Numbers Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">Total Pipeline Actual</span>
              <span className="text-base font-bold text-blue-700">
                {formatCurrency(kpis.totalPipelineActual, filters.unit)}
              </span>
              <span className="block text-[10px] text-slate-600">
                AOP: {formatCurrency(kpis.totalPipelineAop, filters.unit)} ({kpis.pipelineAttainment}%)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Total TCV Actual</span>
              <span className="text-base font-bold text-emerald-700">
                {formatCurrency(kpis.totalTcvActual, filters.unit)}
              </span>
              <span className="block text-[10px] text-slate-600">
                AOP: {formatCurrency(kpis.totalTcvAop, filters.unit)} ({kpis.tcvAttainment}%)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Total Revenue Actual</span>
              <span className="text-base font-bold text-indigo-700">
                {formatCurrency(kpis.totalRevenueActual, filters.unit)}
              </span>
              <span className="block text-[10px] text-slate-600">
                AOP: {formatCurrency(kpis.totalRevenueAop, filters.unit)} ({kpis.revenueAttainment}%)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Net Pipeline Gap</span>
              <span className={`text-base font-bold ${kpis.pipelineGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(kpis.pipelineGap, filters.unit, true)}
              </span>
              <span className="block text-[10px] text-slate-500">Coverage: {kpis.coverageRatio}x</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Net TCV Gap</span>
              <span className={`text-base font-bold ${kpis.tcvGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(kpis.tcvGap, filters.unit, true)}
              </span>
              <span className="block text-[10px] text-slate-500">TCV:Rev: {kpis.tcvToRevenueCoverage}x</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Net Revenue Gap</span>
              <span className={`text-base font-bold ${kpis.revenueGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(kpis.revenueGap, filters.unit, true)}
              </span>
              <span className="block text-[10px] text-slate-500">Win Rate: {kpis.avgWinRate}%</span>
            </div>
          </div>

          {/* Offering Rollup Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              1. Solution Offering Performance Summary
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left min-w-[750px]">
                <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">No</th>
                    <th className="p-2.5">Offering Pillar</th>
                    <th className="p-2.5">Lead Owner</th>
                    <th className="p-2.5 text-right">Pipe Planned</th>
                    <th className="p-2.5 text-right">Pipe Actual</th>
                    <th className="p-2.5 text-right">Pipe Gap</th>
                    <th className="p-2.5 text-right">TCV Planned</th>
                    <th className="p-2.5 text-right">TCV Actual</th>
                    <th className="p-2.5 text-right">Rev Planned</th>
                    <th className="p-2.5 text-right">Rev Actual</th>
                    <th className="p-2.5 text-right">Rev Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {offerings.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-blue-700">{o.no}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{o.name}</td>
                      <td className="p-2.5 text-slate-700">{o.leadOwner}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(o.pipelineAop, filters.unit)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-blue-700">{formatCurrency(o.pipelineActual, filters.unit)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(o.pipelineGap, filters.unit, true)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(o.tcvAop, filters.unit)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(o.tcvActual, filters.unit)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(o.revenueAop ?? (o.tcvAop / 2), filters.unit)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-indigo-700">{formatCurrency(o.revenueActual ?? (o.tcvActual / 2), filters.unit)}</td>
                      <td className={`p-2.5 text-right font-mono font-semibold ${(o.revenueGap ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(o.revenueGap ?? Number(((o.revenueActual ?? 0) - (o.revenueAop ?? 0)).toFixed(2)), filters.unit, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Remedial Actions */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              2. Priority Open Initiatives ({initiatives.length} of {actions.filter(a => a.status !== 'Completed').length} open actions)
            </h4>
            <div className="space-y-2 text-xs">
              {initiatives.length === 0 && <p>No open initiatives.</p>}
              {initiatives.map(action => (
                <div key={action.id} className="report-initiative p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        action.type === 'Pipeline' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {action.type} Remediation
                      </span>
                      <span className="font-bold text-slate-900">{action.title}</span>
                    </div>
                    <p className="text-slate-700 text-[11px] mt-1 font-semibold">{action.offeringName} &gt; {action.subOfferingName || 'Entire offering'}</p>
                    <p className="text-slate-600 text-[11px] mt-1"><strong>Root cause:</strong> {action.rootCause}</p>
                    <p className="text-slate-600 text-[11px] mt-1 whitespace-pre-wrap">
                      {action.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="font-bold text-blue-700 block">{formatCurrency(action.expectedImpact, filters.unit, true)} Expected</span>
                    <span className="text-[10px] text-slate-500 font-medium">{action.owner} • {action.status}</span><span className="block text-[10px] text-slate-500">{action.priority} • Due {action.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>, document.body
  );
};
