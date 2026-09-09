import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  PlusCircle,
  Filter,
  TrendingUp,
  Sliders,
  AlertTriangle,
  Sparkles,
  Calendar,
  User,
  ArrowRight,
  Check,
  Edit2,
  Trash2,
  PlayCircle
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
import { Offering, RemedialAction, FilterOptions, ActionScope } from '../types/dashboard';
import { formatCurrency, formatPercent, getStatusBadgeConfig, calculateOfferingRollup, stripBrackets } from '../utils/calculations';

import { PipelineHierarchy } from './PipelineHierarchy';

interface Layer3PipelineGapsProps {
  offerings: Offering[];
  actions: RemedialAction[];
  filters: FilterOptions;
  onOpenNewActionModal: (type: 'Pipeline' | 'TCV', owner?: string, scope?: ActionScope) => void;
  onEditAction: (action: RemedialAction) => void;
  onUpdateActionStatus: (actionId: string, status: RemedialAction['status']) => void;
  onDeleteAction: (actionId: string) => void;
}

export const Layer3PipelineGaps: React.FC<Layer3PipelineGapsProps> = ({
  offerings,
  actions,
  filters,
  onOpenNewActionModal,
  onEditAction,
  onUpdateActionStatus,
  onDeleteAction
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'board' | 'table' | 'simulator'>('board');

  // Simulator state
  const [campaignBoost, setCampaignBoost] = useState<number>(20); // +20% boost
  const [partnerAcceleration, setPartnerAcceleration] = useState<number>(15); // +15% partner
  const [conversionUplift, setConversionUplift] = useState<number>(10); // +10%

  // Pipeline specific actions
  const scopedOfferings = offerings.filter(o => filters.offeringId === 'All' || o.id === filters.offeringId).map(o => {
    const owner = stripBrackets(filters.owner).trim().toLowerCase();
    const subs = o.subOfferings.filter(s => filters.owner === 'All' || stripBrackets(s.owner).trim().toLowerCase() === owner || stripBrackets(o.leadOwner).trim().toLowerCase() === owner);
    return { ...o, subOfferings: subs, ...calculateOfferingRollup(subs) };
  }).filter(o => o.subOfferings.length);
  const pipelineActions = actions.filter(a => a.type === 'Pipeline' && scopedOfferings.some(o => o.id === a.offeringId && (!a.subOfferingId || o.subOfferings.some(s => s.id === a.subOfferingId))));

  const filteredPipelineActions = pipelineActions.filter(action => {
    if (statusFilter !== 'All' && action.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && action.priority !== priorityFilter) return false;
    if (filters.owner !== 'All' && stripBrackets(action.owner).trim().toLowerCase() !== stripBrackets(filters.owner).trim().toLowerCase()) return false;
    if (filters.offeringId !== 'All' && action.offeringId !== filters.offeringId) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      return (
        action.offeringName.toLowerCase().includes(q) ||
        action.title.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q) ||
        action.subOfferingName.toLowerCase().includes(q) ||
        action.owner.toLowerCase().includes(q) ||
        action.rootCause.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Gap analysis by offering
  const pipelineGapByOffering = scopedOfferings.map(off => ({
    name: off.name.replace(' Services', '').replace('Enablement', 'Enabl.'),
    fullName: off.name,
    aop: off.pipelineAop,
    actual: off.pipelineActual,
    gap: Math.abs(off.pipelineGap),
    deficit: off.pipelineGap < 0 ? Math.abs(off.pipelineGap) : 0,
    surplus: off.pipelineGap > 0 ? off.pipelineGap : 0,
    attainment: off.pipelineAttainment,
    actionsCount: pipelineActions.filter(a => a.offeringId === off.id).length
  }));

  const totalPipelineDeficit = scopedOfferings
    .flatMap(o => o.subOfferings)
    .filter(s => s.pipelineGap < 0)
    .reduce((sum, s) => sum + Math.abs(s.pipelineGap), 0);

  const totalRemedialImpact = pipelineActions
    .filter(a => a.status !== 'Completed')
    .reduce((sum, a) => sum + a.expectedImpact, 0);

  const completedRemedialImpact = pipelineActions
    .filter(a => a.status === 'Completed')
    .reduce((sum, a) => sum + a.expectedImpact, 0);

  // Simulator calculations
  const simulatedPipelineLift = Number((
    (totalPipelineDeficit * (campaignBoost / 100) * 0.45) +
    (totalPipelineDeficit * (partnerAcceleration / 100) * 0.35) +
    (totalPipelineDeficit * (conversionUplift / 100) * 0.40)
  ).toFixed(1));

  const simulatedGapRemaining = Math.max(0, Number((totalPipelineDeficit - simulatedPipelineLift - totalRemedialImpact).toFixed(1)));
  const gapCoveragePercent = totalPipelineDeficit > 0
    ? Math.min(100, Number((((simulatedPipelineLift + totalRemedialImpact) / totalPipelineDeficit) * 100).toFixed(0)))
    : 100;

  return (
    <div className="space-y-6 pb-12">

      {/* Diagnostics Header Info */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              Pipeline Gaps & Remedial Action Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Active tracking and root-cause resolution of top-of-funnel pipeline shortfalls. Monitor action item delivery, lead injection initiatives, and simulated gap recovery trajectories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewActionModal('Pipeline')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Pipeline Remedial Action</span>
          </button>
        </div>
      </div>

      {/* Pipeline Gap Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm bg-gradient-to-br from-rose-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Pipeline Deficit</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {formatCurrency(-totalPipelineDeficit, filters.unit)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {scopedOfferings.flatMap(o => o.subOfferings).filter(s => s.pipelineGap < 0).length} lagging Sub-offerings in {filters.quarter}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">In-Flight Remedial Pipeline</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {formatCurrency(totalRemedialImpact, filters.unit, true)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {pipelineActions.filter(a => a.status !== 'Completed').length} active remediation initiatives
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Recovered Pipeline to Date</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(completedRemedialImpact, filters.unit, true)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            From {pipelineActions.filter(a => a.status === 'Completed').length} fully executed actions
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Remedial Coverage Index</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalPipelineDeficit > 0 ? ((totalRemedialImpact / totalPipelineDeficit) * 100).toFixed(0) : 100}%
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${Math.min(100, (totalRemedialImpact / (totalPipelineDeficit || 1)) * 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Visual Gap Breakdown & Scenario Simulator Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Navigation View Switcher */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'board' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gaps & Actions by Offering ({filteredPipelineActions.length})
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'table' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Action Log Table
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pipeline Recovery Simulator</span>
            </button>
          </div>

          {/* Filter Dropdowns for Actions */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Priority:</span>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab 1: Interactive Kanban Action Cards */}
        {activeTab === 'board' && <PipelineHierarchy offerings={scopedOfferings} actions={filteredPipelineActions} unit={filters.unit}
          onCreate={scope => onOpenNewActionModal('Pipeline', undefined, scope)} onEdit={onEditAction}
          onDelete={onDeleteAction} onComplete={id => onUpdateActionStatus(id, 'Completed')} />}

        {/* Tab 2: Action Log Table */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-4 min-w-[200px]">Action Title & Scope</th>
                  <th className="py-3 px-3 min-w-[150px]">Parent Offering / Practice</th>
                  <th className="py-3 px-3">Owner</th>
                  <th className="py-3 px-3 text-right">Expected Lift</th>
                  <th className="py-3 px-3">Target Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPipelineActions.map(action => (
                  <tr key={action.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        action.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                        action.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {action.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{action.title}</div><p className="text-slate-600">Root cause: {action.rootCause}</p>
                      <div className="text-[11px] text-slate-500 whitespace-pre-wrap">{action.description}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <strong className="block">{action.offeringName}</strong>{action.subOfferingName || 'Entire offering'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {action.owner}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-600">
                      +{formatCurrency(action.expectedImpact, filters.unit)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {action.dueDate}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeConfig(action.status).bg}`}>
                        {action.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditAction(action)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAction(action.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Pipeline Gap Recovery Simulator */}
        {activeTab === 'simulator' && (
          <div className="p-6 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50">
            <div className="max-w-4xl mx-auto space-y-6">

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Pipeline Gap Recovery Simulator
                </h3>
                <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1">
                  Model the impact of tactical interventions (targeted demand campaigns, partner co-sell expansion, and proposal conversion rate uplift) on closing current pipeline deficits.
                </p>
              </div>

              {/* Slider Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Targeted Demand Generation Blitz</span>
                    <span className="text-blue-600 font-bold">+{campaignBoost}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={campaignBoost}
                    onChange={e => setCampaignBoost(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Expedites webinar & executive workshop leads
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Partner Co-Selling Acceleration</span>
                    <span className="text-indigo-600 font-bold">+{partnerAcceleration}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={partnerAcceleration}
                    onChange={e => setPartnerAcceleration(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Siemens, PTC, AWS & hyperscaler joint pursuits
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Proposal Conversion Uplift</span>
                    <span className="text-emerald-600 font-bold">+{conversionUplift}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={conversionUplift}
                    onChange={e => setConversionUplift(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    3-week fast POC sandbox deployments
                  </span>
                </div>
              </div>

              {/* Simulator Outcome Display */}
              <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
                  <div className="p-2">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider">Simulated Incremental Pipeline</span>
                    <span className="text-2xl font-extrabold text-blue-400 mt-1 block">
                      {formatCurrency(simulatedPipelineLift, filters.unit, true)}
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider">Remaining Unmitigated Gap</span>
                    <span className={`text-2xl font-extrabold mt-1 block ${simulatedGapRemaining === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formatCurrency(simulatedGapRemaining, filters.unit)}
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider">Projected Gap Closing Rate</span>
                    <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                      {gapCoveragePercent}%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
