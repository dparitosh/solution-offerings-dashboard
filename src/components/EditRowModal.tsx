import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, AlertCircle, Sparkles } from 'lucide-react';
import { SubOffering, Offering, RegionType } from '../types/dashboard';
import { REGIONS } from '../data/initialData';
import { recalculateSub, setSubTotal, sumSubRegions, MetricField } from '../utils/dataIntegrity';
import { formatCurrency } from '../utils/calculations';

interface EditRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  offering: Offering | null;
  subOffering: SubOffering | null;
  onSave: (offeringId: number, updatedSubOffering: SubOffering) => void;
}

export const EditRowModal: React.FC<EditRowModalProps> = ({
  isOpen,
  onClose,
  offering,
  subOffering,
  onSave
}) => {
  const [formData, setFormData] = useState<SubOffering | null>(null);

  useEffect(() => {
    if (subOffering) {
      setFormData(JSON.parse(JSON.stringify(subOffering)));
    }
  }, [subOffering, isOpen]);

  if (!isOpen || !formData || !offering) return null;

  const updateTotals = (metric: 'pipeline' | 'tcv' | 'revenue', actual: number, aop: number) => {
    setFormData(prev => prev ? setSubTotal(setSubTotal(prev, `${metric}Aop`, Math.max(0, aop)), `${metric}Actual`, Math.max(0, actual)) : null);
  };
  const handlePipelineChange = (actual: number, aop: number) => updateTotals('pipeline', actual, aop);
  const handleTcvChange = (actual: number, aop: number) => updateTotals('tcv', actual, aop);
  const handleRevenueChange = (actual: number, aop: number) => updateTotals('revenue', actual, aop);

  const handleRegionalChange = (region: RegionType, field: MetricField, val: number) => {
    if (!formData) return;
    const currentReg = formData.regionalBreakdown[region] || {
      region,
      pipelineAop: 0,
      pipelineActual: 0,
      tcvAop: 0,
      tcvActual: 0,
      revenueAop: 0,
      revenueActual: 0,
      activeOpportunities: 0,
      topAccounts: []
    };

    const updatedReg = {
      ...currentReg,
      [field]: Math.max(0, val)
    };

    setFormData(sumSubRegions({
      ...formData,
      regionalBreakdown: {
        ...formData.regionalBreakdown,
        [region]: updatedReg
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData && offering) {
      onSave(offering.id, recalculateSub(formData));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
              {offering.name}
            </span>
            <h3 className="text-base font-bold text-white">
              Edit Sub-Offering: {formData.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Practice & Owner Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Offering Practice</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Practice Owner</label>
              <input
                type="text"
                value={formData.owner}
                onChange={e => setFormData({ ...formData, owner: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quarter</label>
              <input
                type="text"
                value={formData.quarter}
                readOnly
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                required
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">Editing a total redistributes it across regions in the existing proportions. Editing a region recalculates the total.</p>
          {/* Pipeline Numbers & Actions */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Pipeline Targets & Actuals (USD $M)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Pipeline Planned (AOP) ($M)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pipelineAop}
                  onChange={e => handlePipelineChange(formData.pipelineActual, Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Pipeline Actual ($M)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pipelineActual}
                  onChange={e => handlePipelineChange(Number(e.target.value), formData.pipelineAop)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-semibold text-blue-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Calculated Gap (Actual - Planned)</label>
                <div className={`text-xs font-mono font-bold p-2 rounded-lg bg-white border border-slate-200 ${formData.pipelineGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formData.pipelineGap >= 0 ? `+${formData.pipelineGap}` : formData.pipelineGap}M ({formData.pipelineAttainment}% Attained)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pipeline Remedial Action Summary</label>
              <textarea
                value={formData.pipelineRemedialActions}
                onChange={e => setFormData({ ...formData, pipelineRemedialActions: e.target.value })}
                rows={2}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Specific tactical remedial action to close pipeline gap..."
              />
            </div>
          </div>

          {/* TCV Numbers & Actions */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Total Contract Value (TCV) Targets & Actuals (USD $M)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">TCV Planned (AOP) ($M)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.tcvAop}
                  onChange={e => handleTcvChange(formData.tcvActual, Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">TCV Actual ($M)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.tcvActual}
                  onChange={e => handleTcvChange(Number(e.target.value), formData.tcvAop)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-semibold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Calculated TCV Gap (Actual - Planned)</label>
                <div className={`text-xs font-mono font-bold p-2 rounded-lg bg-white border border-slate-200 ${formData.tcvGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formData.tcvGap >= 0 ? `+${formData.tcvGap}` : formData.tcvGap}M ({formData.tcvAttainment}% Attained)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">TCV Remedial Action Summary</label>
              <textarea
                value={formData.tcvRemedialActions}
                onChange={e => setFormData({ ...formData, tcvRemedialActions: e.target.value })}
                rows={2}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                placeholder="Specific tactical remedial action to accelerate TCV closing..."
              />
            </div>
          </div>

          {/* Revenue Numbers & Actions */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Revenue Targets & Actuals (USD $M)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Revenue Planned (AOP) ($M)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.revenueAop ?? Number((formData.tcvAop / 2).toFixed(2))}
                  onChange={e => handleRevenueChange(formData.revenueActual ?? 0, Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Revenue Actual ($M)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.revenueActual ?? 0}
                  onChange={e => handleRevenueChange(Number(e.target.value), formData.revenueAop ?? (formData.tcvAop / 2))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono font-semibold text-indigo-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Calculated Revenue Gap (Actual - Planned)</label>
                <div className={`text-xs font-mono font-bold p-2 rounded-lg bg-white border border-slate-200 ${(formData.revenueGap ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(formData.revenueGap ?? 0) >= 0 ? `+${formData.revenueGap ?? 0}` : formData.revenueGap}M ({formData.revenueAttainment ?? 0}% Attained)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Revenue Remedial Action Summary</label>
              <textarea
                value={formData.revenueRemedialActions || ''}
                onChange={e => setFormData({ ...formData, revenueRemedialActions: e.target.value })}
                rows={2}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                placeholder="Specific tactical remedial action to accelerate Revenue realization..."
              />
            </div>
          </div>

          {/* Regional Split Breakdown Editor */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2">Regional Pipeline, TCV & Revenue Breakdown ($M)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REGIONS.map(reg => {
                const rData = formData.regionalBreakdown[reg.name] || {
                  region: reg.name,
                  pipelineAop: 0,
                  pipelineActual: 0,
                  tcvAop: 0,
                  tcvActual: 0,
                  revenueAop: 0,
                  revenueActual: 0,
                  activeOpportunities: 0,
                  topAccounts: []
                };

                return (
                  <div key={reg.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 block mb-2">{reg.name}</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500">Pipe Act ($M)</label>
                        <input
                          type="number"
                  min="0"
                          step="0.01"
                          value={rData.pipelineActual}
                          onChange={e => handleRegionalChange(reg.name, 'pipelineActual', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">TCV Act ($M)</label>
                        <input
                          type="number"
                  min="0"
                          step="0.01"
                          value={rData.tcvActual}
                          onChange={e => handleRegionalChange(reg.name, 'tcvActual', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Rev Act ($M)</label>
                        <input
                          type="number"
                  min="0"
                          step="0.01"
                          value={rData.revenueActual ?? Number((rData.tcvActual / 2).toFixed(2))}
                          onChange={e => handleRegionalChange(reg.name, 'revenueActual', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
