import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ALL_QUARTER_OFFERINGS, ALL_QUARTER_ACTIONS } from './data/initialData';
import { Offering, SubOffering, RemedialAction, FilterOptions, QuarterType, ActionScope } from './types/dashboard';
import { calculateOfferingRollup } from './utils/calculations';
import { ImportMappingModal } from './components/ImportMappingModal';
import { WorkbookAppBuilder } from './components/WorkbookAppBuilder';
import { resolveAction } from './utils/dataIntegrity';
import { defaultDashboard, loadDashboard, saveDashboard } from './utils/storage';
import { Header } from './components/Header';
import { LayerNavigation, LayerId } from './components/LayerNavigation';
import { Layer1Executive } from './components/Layer1Executive';
import { Layer2Regional } from './components/Layer2Regional';
import { Layer3PipelineGaps } from './components/Layer3PipelineGaps';
import { Layer4OwnerTCVGaps } from './components/Layer4OwnerTCVGaps';
import { EditRowModal } from './components/EditRowModal';
import { ActionModal } from './components/ActionModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { VideoDemoModal } from './components/VideoDemoModal';
import { CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';

export default function App() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [initial] = useState(() => {
    try { return { data: loadDashboard(window.localStorage), error: '' }; }
    catch { return { data: defaultDashboard, error: 'Saved data could not be loaded. Default data is shown; the saved copy has not been overwritten.' }; }
  });
  const [allOfferings, setAllOfferings] = useState(initial.data.allOfferings);
  const [allActions, setAllActions] = useState(initial.data.allActions);
  const [storageMessage, setStorageMessage] = useState(initial.error || 'Test data is saved in this browser. Export Excel to back up or share changes.');
  useEffect(() => {
    if (allOfferings === initial.data.allOfferings && allActions === initial.data.allActions) return;
    try {
      saveDashboard(window.localStorage, { allOfferings, allActions });
      setStorageMessage('Changes saved in this browser. Export Excel to back up or share changes.');
    } catch { setStorageMessage('Changes could not be saved in this browser. Export Excel before closing this page.'); }
  }, [allOfferings, allActions]);
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer1_executive');

  const [filters, setFilters] = useState<FilterOptions>({
    quarter: 'Q1 FY 27',
    region: 'All Regions',
    offeringId: 'All',
    owner: 'All',
    searchQuery: '',
    statusFilter: 'All',
    unit: 'M'
  });

  // Current quarter data
  const offerings = useMemo(() => {
    return allOfferings[filters.quarter] || allOfferings['Q1 FY 27'];
  }, [allOfferings, filters.quarter]);

  const actions = useMemo(() => {
    return (allActions[filters.quarter] || []).map(action => resolveAction(action, offerings));
  }, [allActions, filters.quarter, offerings]);

  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [editingSubOffering, setEditingSubOffering] = useState<SubOffering | null>(null);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionToEdit, setActionToEdit] = useState<RemedialAction | null>(null);
  const [defaultActionType, setDefaultActionType] = useState<RemedialAction['type']>('Pipeline');
  const [defaultActionScope, setDefaultActionScope] = useState<ActionScope | undefined>();
  const [defaultActionOwner, setDefaultActionOwner] = useState<string | undefined>(undefined);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [videoDemoModalOpen, setVideoDemoModalOpen] = useState(false);
  const [importSource, setImportSource] = useState<{ buffer: ArrayBuffer; name: string; quarter: QuarterType } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sub-Offering Save Handler with dynamic Parent Offering rollup recalculation
  const handleSaveSubOffering = (offeringId: number, updatedSub: SubOffering) => {
    setAllOfferings(prevAll => {
      const currentQuarterOfferings = prevAll[filters.quarter] || prevAll['Q1 FY 27'];
      const updatedOfferings = currentQuarterOfferings.map(off => {
        if (off.id === offeringId) {
          const updatedSubOfferings = off.subOfferings.map(sub =>
            sub.id === updatedSub.id ? updatedSub : sub
          );
          const rollups = calculateOfferingRollup(updatedSubOfferings);
          return {
            ...off,
            subOfferings: updatedSubOfferings,
            pipelineAop: rollups.pipelineAop,
            pipelineActual: rollups.pipelineActual,
            pipelineGap: rollups.pipelineGap,
            pipelineAttainment: rollups.pipelineAttainment,
            tcvAop: rollups.tcvAop,
            tcvActual: rollups.tcvActual,
            tcvGap: rollups.tcvGap,
            tcvAttainment: rollups.tcvAttainment,
            revenueAop: rollups.revenueAop,
            revenueActual: rollups.revenueActual,
            revenueGap: rollups.revenueGap,
            revenueAttainment: rollups.revenueAttainment,
            status: rollups.status
          };
        }
        return off;
      });

      return {
        ...prevAll,
        [filters.quarter]: updatedOfferings
      };
    });
    showToast(`Updated sub-offering "${updatedSub.name}" and recalculated practice rollups for ${filters.quarter}.`);
  };

  // Remedial Actions handlers
  const handleSaveAction = (newOrUpdatedAction: RemedialAction) => {
    newOrUpdatedAction = resolveAction(newOrUpdatedAction, offerings);
    setAllActions(prevAll => {
      const currentQuarterActions = prevAll[filters.quarter] || [];
      const exists = currentQuarterActions.some(a => a.id === newOrUpdatedAction.id);
      const updatedActions = exists
        ? currentQuarterActions.map(a => a.id === newOrUpdatedAction.id ? newOrUpdatedAction : a)
        : [newOrUpdatedAction, ...currentQuarterActions];

      return {
        ...prevAll,
        [filters.quarter]: updatedActions
      };
    });
    showToast(`Remedial action "${newOrUpdatedAction.title}" saved successfully for ${filters.quarter}.`);
  };

  const handleUpdateActionStatus = (actionId: string, newStatus: RemedialAction['status']) => {
    setAllActions(prevAll => {
      const currentQuarterActions = prevAll[filters.quarter] || [];
      const updatedActions = currentQuarterActions.map(a => a.id === actionId ? {
        ...a,
        status: newStatus,
        progressPercent: newStatus === 'Completed' ? 100 : a.progressPercent
      } : a);

      return {
        ...prevAll,
        [filters.quarter]: updatedActions
      };
    });
    showToast(`Action status updated to ${newStatus}.`);
  };

  const handleDeleteAction = (actionId: string) => {
    setAllActions(prevAll => {
      const currentQuarterActions = prevAll[filters.quarter] || [];
      return {
        ...prevAll,
        [filters.quarter]: currentQuarterActions.filter(a => a.id !== actionId)
      };
    });
    showToast('Action removed.');
  };

  const handleOpenNewActionModal = (type: RemedialAction['type'] = 'Pipeline', preselectedOwner?: string, scope?: ActionScope) => {
    setActionToEdit(null);
    setDefaultActionType(type);
    setDefaultActionScope(scope);
    setDefaultActionOwner(preselectedOwner);
    setActionModalOpen(true);
  };

  const handleEditAction = (action: RemedialAction) => {
    setActionToEdit(action);
    setActionModalOpen(true);
  };

  const handleEditSubOfferingTrigger = (offeringId: number, sub: SubOffering) => {
    const parent = offerings.find(o => o.id === offeringId) || null;
    setEditingOffering(parent);
    setEditingSubOffering(sub);
    setEditModalOpen(true);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all pipeline, TCV and action data to default values across all quarters?')) {
      setAllOfferings(ALL_QUARTER_OFFERINGS);
      setAllActions(ALL_QUARTER_ACTIONS);
      showToast('All quarterly data reset to default template values.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const quarter = filters.quarter;
    try {
      setImportSource({ buffer: await file.arrayBuffer(), name: file.name, quarter });
    } catch (error) {
      showToast(`Import failed: ${error instanceof Error ? error.message : 'Unable to read file.'}`);
    }
  };

  if (builderOpen) return <WorkbookAppBuilder onClose={() => setBuilderOpen(false)} />;
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage.startsWith('Import failed') ? <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Global Header & KPI Ribbon */}
      <Header
        filters={filters}
        setFilters={setFilters}
        offerings={offerings}
        actions={actions}
        onOpenReportModal={() => setReportModalOpen(true)}
        onOpenVideoDemoModal={() => setVideoDemoModalOpen(true)}
        onImportFile={handleImportFile}
        onOpenAppBuilder={() => setBuilderOpen(true)}
      />

<p role="status" className="px-4 py-2 text-center text-xs bg-amber-50 text-amber-900">{storageMessage}</p>
      {/* Navigation Tabs */}
      <LayerNavigation
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        offerings={offerings}
        actions={actions}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full">

        {/* Dashboard */}
        {activeLayer === 'layer1_executive' && (
          <Layer1Executive
            offerings={offerings}
            filters={filters}
            setFilters={setFilters}
            actions={actions}
            onEditSubOffering={handleEditSubOfferingTrigger}
            onViewSubOffering={(offeringId, sub) => handleEditSubOfferingTrigger(offeringId, sub)}
            onQuickAction={(offering, sub, type) => {
              setDefaultActionType(type || 'Pipeline');
              setDefaultActionScope({ offeringId: offering.id, subOfferingId: sub?.id || '' });
              setDefaultActionOwner(sub?.owner || offering.leadOwner);
              setActionToEdit(null);
              setActionModalOpen(true);
            }}
            onOpenNewActionModal={handleOpenNewActionModal}
            onResetData={handleResetData}
          />
        )}

        {/* Geography View */}
        {activeLayer === 'layer2_regional' && (
          <Layer2Regional
            offerings={offerings}
            filters={filters}
            setFilters={setFilters}
            onOpenNewActionModal={handleOpenNewActionModal}
          />
        )}

        {/* Pipeline Gaps & Remedial Actions */}
        {activeLayer === 'layer3_pipeline_gaps' && (
          <Layer3PipelineGaps
            offerings={offerings}
            actions={actions}
            filters={filters}
            onOpenNewActionModal={handleOpenNewActionModal}
            onEditAction={handleEditAction}
            onUpdateActionStatus={handleUpdateActionStatus}
            onDeleteAction={handleDeleteAction}
          />
        )}

        {/* TCV Gaps & Remedial Actions */}
        {activeLayer === 'layer4_owner_tcv' && (
          <Layer4OwnerTCVGaps
            offerings={offerings}
            actions={actions}
            filters={filters}
            onOpenNewActionModal={handleOpenNewActionModal}
            onEditAction={handleEditAction}
            onUpdateActionStatus={handleUpdateActionStatus}
            onDeleteAction={handleDeleteAction}
          />
        )}

      </main>

      {/* Modals */}
      {importSource && <ImportMappingModal {...importSource}
        offerings={allOfferings[importSource.quarter]} actions={allActions[importSource.quarter] || []}
        onClose={() => setImportSource(null)} onApply={parsed => {
          const quarter = importSource.quarter;
          setAllOfferings(prev => ({ ...prev, [quarter]: parsed.offerings }));
          setAllActions(prev => ({ ...prev, [quarter]: parsed.actions }));
          setFilters(prev => ({ ...prev, quarter, offeringId: 'All', owner: 'All', searchQuery: '', statusFilter: 'All' }));
          setImportSource(null);
          showToast(`Imported ${parsed.offerings.length} offerings and ${parsed.actions.length} actions for ${quarter}.`);
        }} />}
      <EditRowModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        offering={editingOffering}
        subOffering={editingSubOffering}
        onSave={handleSaveSubOffering}
      />

      <ActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        offerings={offerings}
        actionToEdit={actionToEdit}
        defaultType={defaultActionType}
        defaultOwner={defaultActionOwner}
        defaultScope={defaultActionScope}
        quarter={filters.quarter}
        onSaveAction={handleSaveAction}
      />

      <ExecutiveReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        offerings={offerings}
        actions={actions}
        filters={filters}
      />

      <VideoDemoModal
        isOpen={videoDemoModalOpen}
        onClose={() => setVideoDemoModalOpen(false)}
        onNavigateLayer={(layerNum) => {
          if (layerNum === 1) setActiveLayer('layer1_executive');
          else if (layerNum === 2) setActiveLayer('layer2_regional');
          else if (layerNum === 3) setActiveLayer('layer3_pipeline_gaps');
          else if (layerNum === 4) setActiveLayer('layer4_owner_tcv');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Digital Thread Solutions - Business Health Suite • {filters.quarter}</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Digital Thread Operations & AOP KPI Reporting Governance
          </div>
        </div>
      </footer>

    </div>
  );
}
