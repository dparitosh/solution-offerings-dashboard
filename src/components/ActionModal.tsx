import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle2, Target, AlertTriangle, Sparkles } from 'lucide-react';
import { RemedialAction, Offering, RemedialPriority, RemedialStatus, QuarterType, ActionScope } from '../types/dashboard';

import { initialActionScope, resolveAction } from '../utils/dataIntegrity';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerings: Offering[];
  actionToEdit?: RemedialAction | null;
  defaultType?: RemedialAction['type'];
  defaultScope?: ActionScope;
  quarter: QuarterType;
  defaultOwner?: string;
  onSaveAction: (action: RemedialAction) => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  offerings,
  actionToEdit,
  defaultType = 'Pipeline',
  defaultOwner,
  defaultScope,
  quarter,
  onSaveAction
}) => {
  const [type, setType] = useState<RemedialAction['type']>(defaultType);
  const [selectedOfferingId, setSelectedOfferingId] = useState<number>(1);
  const [selectedSubOfferingId, setSelectedSubOfferingId] = useState<string>('1-1');
  const [owner, setOwner] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [rootCause, setRootCause] = useState<string>('');
  const [expectedImpact, setExpectedImpact] = useState<number>(1.5);
  const [targetQuarter, setTargetQuarter] = useState<QuarterType>('Q1 FY 27');
  const [dueDate, setDueDate] = useState<string>('2026-09-30');
  const [priority, setPriority] = useState<RemedialPriority>('High');
  const [status, setStatus] = useState<RemedialStatus>('In Progress');
  const [progressPercent, setProgressPercent] = useState<number>(50);

  useEffect(() => {
    if (!isOpen) return;
    if (actionToEdit) {
      setType(actionToEdit.type);
      setSelectedOfferingId(actionToEdit.offeringId);
      setSelectedSubOfferingId(actionToEdit.subOfferingId);
      setOwner(actionToEdit.owner);
      setTitle(actionToEdit.title);
      setDescription(actionToEdit.description);
      setRootCause(actionToEdit.rootCause);
      setExpectedImpact(actionToEdit.expectedImpact);
      setTargetQuarter(actionToEdit.targetQuarter);
      setDueDate(actionToEdit.dueDate);
      setPriority(actionToEdit.priority);
      setStatus(actionToEdit.status);
      setProgressPercent(actionToEdit.progressPercent);
    } else {
      setType(defaultType);
      const scope = initialActionScope(offerings, defaultScope, defaultOwner);
      const off = offerings.find(o => o.id === scope?.offeringId);
      const sub = off?.subOfferings.find(s => s.id === scope?.subOfferingId);
      setSelectedOfferingId(off?.id || 0);
      setSelectedSubOfferingId(sub?.id || '');
      setOwner(defaultOwner || sub?.owner || off?.leadOwner || '');
      setTargetQuarter(quarter);
      setDueDate(new Date().toISOString().slice(0, 10));
      setTitle('');
      setDescription('');
      setRootCause('');
      setExpectedImpact(defaultType === 'Pipeline' ? 2.0 : 0.8);
      setPriority('High');
      setStatus('In Progress');
      setProgressPercent(40);
    }
  }, [actionToEdit, isOpen, defaultType, defaultOwner, defaultScope, offerings, quarter]);

  if (!isOpen) return null;

  const currentOffering = offerings.find(o => o.id === selectedOfferingId);
  const subOfferings = currentOffering?.subOfferings || [];

  const handleOfferingChange = (offId: number) => {
    setSelectedOfferingId(offId);
    const off = offerings.find(o => o.id === offId);
    if (off) {
      setSelectedSubOfferingId('');
      setOwner(off.leadOwner);
    }
  };

  const handleSubOfferingChange = (subId: string) => {
    setSelectedSubOfferingId(subId);
    const sub = subOfferings.find(s => s.id === subId);
    if (sub) {
      setOwner(sub.owner);
    } else {
      setOwner(currentOffering?.leadOwner || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentSub = subOfferings.find(s => s.id === selectedSubOfferingId);

    if (!currentOffering || (selectedSubOfferingId && !currentSub)) return;
    const actionData: RemedialAction = {
      id: actionToEdit ? actionToEdit.id : `act-${crypto.randomUUID()}`,
      type,
      offeringId: selectedOfferingId,
      subOfferingId: selectedSubOfferingId,
      offeringName: currentOffering?.name || '',
      subOfferingName: currentSub?.name || '',
      owner,
      title,
      description,
      rootCause,
      expectedImpact: Number(expectedImpact),
      targetQuarter,
      dueDate,
      priority,
      status,
      progressPercent: Number(progressPercent),
      keyStakeholders: actionToEdit?.keyStakeholders || [owner, `${currentOffering?.leadOwner} (Lead)`]
    };

    onSaveAction(resolveAction(actionData, offerings));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">

        {/* Modal Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${
          type === 'Pipeline' ? 'bg-blue-900' : 'bg-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/20 uppercase tracking-wider">
              {type} Remedial Action
            </span>
            <h3 className="text-base font-bold">
              {actionToEdit ? 'Edit Remedial Action' : 'Log New Remedial Action'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Action Type Toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setType('Pipeline')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                type === 'Pipeline' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline Gap Action
            </button>
            <button
              type="button"
              onClick={() => setType('TCV')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                type === 'TCV' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              TCV Contract Value Action
            </button>
            <button type="button" onClick={() => setType('Revenue')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${type === 'Revenue' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Revenue Action</button>
          </div>

<p className="text-xs text-slate-600">Quarter: {quarter}. Select the parent offering and, optionally, a specific sub-offering.</p>
          {/* Offering & Sub-Offering Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Solution Offering</label>
              <select
                value={selectedOfferingId}
                onChange={e => handleOfferingChange(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                {offerings.map(o => (
                  <option key={o.id} value={o.id}>{o.no}. {o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Offering Practice</label>
              <select
                value={selectedSubOfferingId}
                onChange={e => handleSubOfferingChange(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="">Entire offering</option>
                {subOfferings.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.owner})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remedial Action Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Executive Sponsorship Blitz on Aerospace Pursuits"
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium"
              required
            />
          </div>

          {/* Root Cause Analysis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Root Cause Deficit (Why is there a gap?)
            </label>
            <input
              type="text"
              value={rootCause}
              onChange={e => setRootCause(e.target.value)}
              placeholder="e.g. Elongated security qualification and RFP proposal latency"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
              required
            />
          </div>

          {/* Action Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tactical Remediation Plan Details
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe specific tactical interventions, partner engagements, or executive actions..."
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
              required
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected {type} Lift ($M)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expectedImpact}
                onChange={e => setExpectedImpact(Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold text-blue-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Action Owner</label>
              <input
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono"
                required
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as RemedialPriority)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as RemedialStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Progress: {status === 'Completed' ? 100 : progressPercent}%
              </label>
              <input
                disabled={status === 'Completed'}
                type="range"
                min="0"
                max="100"
                value={status === 'Completed' ? 100 : progressPercent}
                onChange={e => setProgressPercent(Number(e.target.value))}
                className="w-full mt-2 accent-blue-600"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm"
            >
              {actionToEdit ? 'Update Action' : 'Create Remedial Action'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
