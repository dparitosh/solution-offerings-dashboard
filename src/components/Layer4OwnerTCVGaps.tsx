import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  User,
  Award,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Target,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Edit2,
  Trash2,
  Layers,
  FileCheck,
  Briefcase,
  XCircle,
  HelpCircle
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
import { Offering, RemedialAction, OwnerPerformance, FilterOptions } from '../types/dashboard';
import { calculateOwnerPerformances, formatCurrency, formatPercent, getStatusBadgeConfig } from '../utils/calculations';
import { CustomMultiLineTick } from './CustomMultiLineTick';

interface Layer4OwnerTCVGapsProps {
  offerings: Offering[];
  actions: RemedialAction[];
  filters: FilterOptions;
  onOpenNewActionModal: (type: 'Pipeline' | 'TCV', preselectedOwner?: string) => void;
  onEditAction: (action: RemedialAction) => void;
  onUpdateActionStatus: (actionId: string, status: RemedialAction['status']) => void;
  onDeleteAction: (actionId: string) => void;
}

// Helper to parse action plan text into clear bullet points
function parseActionPlanBullets(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  // Split by newlines, semicolons, or explicit bullet characters (•, -, *)
  let items = text
    .split(/\r?\n|•|;|–|\u2022/)
    .map(s => s.trim().replace(/^[-*•\d+.\s]+/, '').trim())
    .filter(s => s.length > 0);

  // If only 1 long block and it has multiple complete sentences, split by sentence
  if (items.length <= 1 && text.includes('. ')) {
    const sentenceSplit = text
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map(s => s.trim().replace(/^[-*•\d+.\s]+/, '').trim())
      .filter(s => s.length > 0);
    if (sentenceSplit.length > 1) {
      items = sentenceSplit;
    }
  }

  if (items.length === 0 && text.trim().length > 0) {
    items = [text.trim()];
  }

  return items;
}

export const Layer4OwnerTCVGaps: React.FC<Layer4OwnerTCVGapsProps> = ({
  offerings,
  actions,
  filters,
  onOpenNewActionModal,
  onEditAction,
  onUpdateActionStatus,
  onDeleteAction
}) => {
  // Owner is empty by default so details are shown only upon selection
  const [selectedOwnerName, setSelectedOwnerName] = useState<string>(
    filters.owner !== 'All' ? filters.owner : ''
  );
  const [offeringSortBy, setOfferingSortBy] = useState<'volume' | 'gap' | 'attainment'>('volume');

  // Sync with external filters if changed
  useEffect(() => {
    if (filters.owner !== 'All') {
      setSelectedOwnerName(filters.owner);
    }
  }, [filters.owner]);

  const ownerPerformances = calculateOwnerPerformances(offerings, actions);
  const tcvActions = actions.filter(a => a.type === 'TCV');

  // Selected owner performance object if an owner is chosen
  const selectedOwner = selectedOwnerName
    ? ownerPerformances.find(o => o.ownerName.toLowerCase() === selectedOwnerName.toLowerCase())
    : null;

  // Chart data: Solution Offerings TCV comparison
  const offeringChartData = offerings
    .map(off => ({
      name: off.name.replace(' Services', '').replace('Enablement', 'Enabl.'),
      fullName: off.name,
      tcvAop: off.tcvAop,
      tcvActual: off.tcvActual,
      tcvGap: Math.abs(off.tcvGap),
      deficit: off.tcvGap < 0 ? Math.abs(off.tcvGap) : 0,
      surplus: off.tcvGap > 0 ? off.tcvGap : 0,
      attainment: off.tcvAttainment,
      actionsCount: tcvActions.filter(a => a.offeringId === off.id).length
    }))
    .sort((a, b) => {
      if (offeringSortBy === 'gap') return b.deficit - a.deficit;
      if (offeringSortBy === 'attainment') return a.attainment - b.attainment;
      return b.tcvAop - a.tcvAop;
    });

  // Offering roll-up totals
  const totalTcvTarget = offerings.reduce((sum, o) => sum + o.tcvAop, 0);
  const totalTcvActual = offerings.reduce((sum, o) => sum + o.tcvActual, 0);
  const totalTcvDeficit = offerings.reduce((sum, o) => sum + (o.tcvGap < 0 ? Math.abs(o.tcvGap) : 0), 0);
  const overallTcvAttainment = totalTcvTarget > 0 ? Number(((totalTcvActual / totalTcvTarget) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6 pb-12">

      {/* Accountability Header Info */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              Total Contract Value (TCV) Gaps & Remedial Actions
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Offering and practice owner contract value targets, actual booked delivery, gap remediation strategies, and action cards for {filters.quarter}.
          </p>
        </div>

        <button
          onClick={() => onOpenNewActionModal('TCV', selectedOwner?.ownerName)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Assign TCV Remedial Action</span>
        </button>
      </div>

      {/* Solution Offerings TCV Comparison Visual Graph (Full Width) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Solution Offerings: TCV AOP Target vs Actual Booked ({filters.unit === 'M' ? '$M' : '$K'})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizing contract value commitments, actuals, and delivery across Solution Offerings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <span className="text-slate-500 px-1 text-[11px]">Sort:</span>
              <button
                onClick={() => setOfferingSortBy('volume')}
                className={`px-2.5 py-1 rounded font-medium text-xs transition ${offeringSortBy === 'volume' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                By Target
              </button>
              <button
                onClick={() => setOfferingSortBy('gap')}
                className={`px-2.5 py-1 rounded font-medium text-xs transition ${offeringSortBy === 'gap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                By Gap
              </button>
              <button
                onClick={() => setOfferingSortBy('attainment')}
                className={`px-2.5 py-1 rounded font-medium text-xs transition ${offeringSortBy === 'attainment' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                By Attainment
              </button>
            </div>
          </div>
        </div>

        {/* Offering KPI Overview Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Total TCV Target</span>
            <span className="text-base font-bold text-slate-800">{formatCurrency(totalTcvTarget, filters.unit)}</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-700 font-medium block">Total TCV Actual Booked</span>
            <span className="text-base font-bold text-emerald-700">{formatCurrency(totalTcvActual, filters.unit)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">{overallTcvAttainment}% Attainment</span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100">
            <span className="text-[11px] text-rose-700 font-medium block">Total TCV Deficit Gap</span>
            <span className="text-base font-bold text-rose-700">-{formatCurrency(totalTcvDeficit, filters.unit)}</span>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
            <span className="text-[11px] text-indigo-700 font-medium block">TCV Remedial Initiatives</span>
            <span className="text-base font-bold text-indigo-700">{tcvActions.length} Actions</span>
            <span className="text-[10px] text-indigo-600 font-medium block">+{formatCurrency(tcvActions.reduce((s, a) => s + a.expectedImpact, 0), filters.unit)} Target Impact</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-80 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={offeringChartData} margin={{ top: 12, right: 15, left: -5, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={<CustomMultiLineTick maxChars={18} fontSize={10} />}
                interval={0}
                height={48}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit={filters.unit === 'M' ? 'M' : 'K'} />
              <Tooltip
                formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}${filters.unit}`, name]}
                labelFormatter={(label) => {
                  const item = offeringChartData.find(d => d.name === label);
                  return item ? `${item.fullName} (Attainment: ${item.attainment}%)` : String(label);
                }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
              <Bar dataKey="tcvAop" name="TCV AOP Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tcvActual" name="TCV Actual Booked" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
          <span>Tracking <strong>{offerings.length} Solution Offerings</strong></span>
          <span>Total TCV Deficit Gap: <strong className="text-rose-600">-{formatCurrency(totalTcvDeficit, filters.unit)}</strong></span>
        </div>
      </div>

      {/* Owner Filter Dropdown & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto flex-1">
          <label htmlFor="owner-filter-dropdown" className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Select Practice Owner:</span>
          </label>

          <div className="relative w-full sm:max-w-md">
            <select
              id="owner-filter-dropdown"
              value={selectedOwnerName}
              onChange={(e) => setSelectedOwnerName(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="">-- Select a Practice Owner to view details ({ownerPerformances.length} available) --</option>
              {ownerPerformances.map(owner => (
                <option key={owner.ownerName} value={owner.ownerName}>
                  {owner.ownerName} — {owner.status} ({owner.openActionsCount} actions • Attainment: {formatPercent(owner.tcvAttainment)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedOwner && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setSelectedOwnerName('')}
              className="text-xs text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
            <span className="text-xs text-slate-500">
              Viewing details for: <strong className="text-slate-800">{selectedOwner.ownerName}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Practice Owner Details Display: ONLY UPON SELECTION */}
      {selectedOwner && (() => {
          const ownerTcvActions = tcvActions.filter(a => a.owner.toLowerCase() === selectedOwner.ownerName.toLowerCase());
          const statusBadge = getStatusBadgeConfig(selectedOwner.status);

          return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Scorecard Header */}
              <div className="p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-900 text-white font-bold flex items-center justify-center text-base shadow-sm">
                    {selectedOwner.ownerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{selectedOwner.ownerName}</h3>
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${statusBadge.bg}`}>
                        {selectedOwner.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-slate-500 font-medium">Practices Led:</span>
                      {selectedOwner.subOfferings.map((sub, sIdx) => (
                        <span key={sIdx} className="text-[11px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => onOpenNewActionModal('TCV', selectedOwner.ownerName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add TCV Action for {selectedOwner.ownerName}</span>
                  </button>
                  <button
                    onClick={() => setSelectedOwnerName('')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                    title="Close Details"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* KPI Matrix for this Owner */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 bg-white border-b border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">TCV AOP Target</span>
                  <span className="font-bold text-slate-800 text-base mt-0.5 block">
                    {formatCurrency(selectedOwner.totalTcvAop, filters.unit)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 block font-medium">TCV Actual Booked</span>
                  <span className="font-bold text-emerald-700 text-base mt-0.5 block">
                    {formatCurrency(selectedOwner.totalTcvActual, filters.unit)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    {formatPercent(selectedOwner.tcvAttainment)} Attainment
                  </span>
                </div>

                <div className={`p-3 rounded-lg border ${selectedOwner.tcvGap >= 0 ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                  <span className={`text-[11px] block font-medium ${selectedOwner.tcvGap >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    TCV Gap Deficit
                  </span>
                  <span className={`font-bold text-base mt-0.5 block ${selectedOwner.tcvGap >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(selectedOwner.tcvGap, filters.unit, true)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Pipeline Coverage</span>
                  <span className="font-bold text-slate-800 text-base mt-0.5 block">
                    {selectedOwner.coverageRatio}x
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Pipeline: {formatCurrency(selectedOwner.totalPipelineActual, filters.unit)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Weighted Win Rate</span>
                  <span className="font-bold text-slate-800 text-base mt-0.5 block">
                    {selectedOwner.winRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {selectedOwner.subOfferings.length} Practice{selectedOwner.subOfferings.length === 1 ? '' : 's'} Led
                  </span>
                </div>

                <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100">
                  <span className="text-[11px] text-indigo-700 block font-medium">Remedial Actions</span>
                  <span className="font-bold text-indigo-700 text-base mt-0.5 block">
                    {ownerTcvActions.length} Actions
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
                    {selectedOwner.openActionsCount} In Progress
                  </span>
                </div>
              </div>

              {/* Owner TCV Remedial Actions List / Action Cards with Bullets */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    TCV Remedial Action Plan for {selectedOwner.ownerName} ({ownerTcvActions.length})
                  </span>
                  <button
                    onClick={() => onOpenNewActionModal('TCV', selectedOwner.ownerName)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add New Action</span>
                  </button>
                </div>

                {ownerTcvActions.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    <p className="font-medium text-slate-600">No specific TCV remedial actions currently logged for {selectedOwner.ownerName}.</p>
                    <button
                      onClick={() => onOpenNewActionModal('TCV', selectedOwner.ownerName)}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      + Create first remedial action
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ownerTcvActions.map(action => {
                      const bullets = parseActionPlanBullets(action.description);
                      return (
                        <div
                          key={action.id}
                          className="p-4 bg-slate-50/90 rounded-lg border border-slate-200 hover:border-slate-300 transition text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{action.title}</div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  Offering: {action.subOfferingName || action.offeringName}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 border ${getStatusBadgeConfig(action.status).bg}`}>
                                {action.status}
                              </span>
                            </div>

                            {/* Action Plan in Bullets */}
                            <div className="mt-3">
                              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <FileCheck className="w-3 h-3 text-emerald-600" />
                                <span>Action Plan:</span>
                              </div>
                              <ul className="space-y-1 pl-0.5">
                                {bullets.map((bullet, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Root Cause Display */}
                            {action.rootCause && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] text-slate-500">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium text-slate-600">Root Cause: </span>
                                  <span>{action.rootCause}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-emerald-700">
                              Target TCV Lift: +{formatCurrency(action.expectedImpact, filters.unit)}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Due {action.dueDate}
                            </span>

                            <div className="flex items-center gap-1">
                              {action.status !== 'Completed' && (
                                <button
                                  onClick={() => onUpdateActionStatus(action.id, 'Completed')}
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-50 transition"
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => onEditAction(action)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition"
                                title="Edit Action"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDeleteAction(action.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Action"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Accountability: <strong>{selectedOwner.ownerName}</strong></span>
                <span>{selectedOwner.openActionsCount} Open Remedial Actions Pending</span>
              </div>
            </div>
          );
        })()}

    </div>
  );
};
