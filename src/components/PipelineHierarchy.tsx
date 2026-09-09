import React from 'react';
import { ActionScope, FilterOptions, Offering, RemedialAction } from '../types/dashboard';
import { formatCurrency, getStatusBadgeConfig } from '../utils/calculations';

interface Props {
  offerings: Offering[];
  actions: RemedialAction[];
  unit: FilterOptions['unit'];
  onCreate: (scope: ActionScope) => void;
  onEdit: (action: RemedialAction) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export function PipelineHierarchy({ offerings, actions, unit, onCreate, onEdit, onDelete, onComplete }: Props) {
  const renderActions = (offeringId: number, subOfferingId: string) => {
    const scoped = actions.filter(a => a.offeringId === offeringId && a.subOfferingId === subOfferingId);
    return scoped.length ? <div className="grid md:grid-cols-2 gap-3 mt-3">{scoped.map(action => (
      <article key={action.id} className="bg-white border border-slate-200 rounded-lg p-4 text-xs space-y-2" aria-label={action.title}>
        <div className="flex justify-between gap-2"><h5 className="font-bold text-slate-900">{action.title}</h5><span className={`border rounded px-2 whitespace-nowrap ${getStatusBadgeConfig(action.status).bg}`}>{action.status}</span></div>
        <p><strong>Root cause:</strong> {action.rootCause}</p>
        <p className="whitespace-pre-wrap"><strong>Remedial plan:</strong> {action.description}</p>
        <p><strong>Owner:</strong> {action.owner} · <strong>Priority:</strong> {action.priority}</p>
        <p><strong>Expected lift:</strong> {formatCurrency(action.expectedImpact, unit)} · <strong>Due:</strong> {action.dueDate} · {action.targetQuarter}</p>
        <p><strong>Progress:</strong> {action.progressPercent}%</p>
        <div className="flex gap-3 pt-1">
          <button className="text-blue-700 font-semibold" onClick={() => onEdit(action)}>Edit action</button>
          {action.status !== 'Completed' && <button className="text-emerald-700 font-semibold" onClick={() => onComplete(action.id)}>Mark Done</button>}
          <button className="text-rose-700" onClick={() => onDelete(action.id)}>Delete action</button>
        </div>
      </article>
    ))}</div> : <p className="mt-2 text-xs text-slate-500">No actions match the current filters for this scope.</p>;
  };

  if (!offerings.length) return <p className="p-6 text-sm text-slate-500">No offerings match the current filters.</p>;
  return <div className="p-5 space-y-5">{offerings.map(off => (
    <section key={off.id} className="border border-slate-200 rounded-xl overflow-hidden" aria-label={off.name}>
      <div className="bg-slate-100 p-4">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-sm">{off.no}. {off.name}</h3><button className="text-xs font-semibold text-blue-700" onClick={() => onCreate({ offeringId: off.id, subOfferingId: '' })}>+ Offering action</button></div>
        <p className="text-xs mt-1">Lead: {off.leadOwner} · Planned: {formatCurrency(off.pipelineAop, unit)} · Actual: {formatCurrency(off.pipelineActual, unit)} · <strong>Net pipeline gap: {formatCurrency(off.pipelineGap, unit, true)}</strong></p>
        {off.pipelineRemedialActions && <p className="text-xs mt-2 whitespace-pre-wrap"><strong>Offering plan:</strong> {off.pipelineRemedialActions}</p>}
        {renderActions(off.id, '')}
      </div>
      <div className="divide-y divide-slate-200">{off.subOfferings.map(sub => (
        <section key={sub.id} className="p-4 pl-7 bg-slate-50/50" aria-label={sub.name}>
          <div className="flex flex-wrap justify-between gap-2"><h4 className="text-sm font-semibold">{sub.name}</h4><button className="text-xs font-semibold text-blue-700" onClick={() => onCreate({ offeringId: off.id, subOfferingId: sub.id })}>+ Sub-offering action</button></div>
          <p className="text-xs mt-1">Owner: {sub.owner} · Planned: {formatCurrency(sub.pipelineAop, unit)} · Actual: {formatCurrency(sub.pipelineActual, unit)} · <strong className={sub.pipelineGap < 0 ? 'text-rose-700' : 'text-emerald-700'}>Pipeline gap: {formatCurrency(sub.pipelineGap, unit, true)}</strong></p>
          {sub.pipelineRemedialActions && <p className="text-xs mt-2 whitespace-pre-wrap"><strong>Practice plan:</strong> {sub.pipelineRemedialActions}</p>}
          {renderActions(off.id, sub.id)}
        </section>
      ))}</div>
    </section>
  ))}</div>;
}
