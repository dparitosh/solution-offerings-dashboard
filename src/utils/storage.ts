import { ALL_QUARTER_ACTIONS, ALL_QUARTER_OFFERINGS, QUARTERS_LIST } from '../data/initialData';
import { Offering, QuarterType, RemedialAction } from '../types/dashboard';
import { metricFields, recalculateSub, resolveAction } from './dataIntegrity';

export const STORAGE_KEY = 'solution-offerings-dashboard-v1';
export interface DashboardData {
  allOfferings: Record<QuarterType, Offering[]>;
  allActions: Record<QuarterType, RemedialAction[]>;
}
export const defaultDashboard: DashboardData = { allOfferings: ALL_QUARTER_OFFERINGS, allActions: ALL_QUARTER_ACTIONS };

export function loadDashboard(storage: Pick<Storage, 'getItem'>): DashboardData {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return defaultDashboard;
  const data = JSON.parse(raw) as DashboardData;
  for (const quarter of QUARTERS_LIST) {
    const offerings = data.allOfferings?.[quarter], actions = data.allActions?.[quarter];
    if (!Array.isArray(offerings) || !Array.isArray(actions)) throw new Error('Saved data is incomplete.');
    for (const off of offerings) {
      if (off.quarter !== quarter || !Array.isArray(off.subOfferings)) throw new Error('Saved offering has an invalid quarter.');
      for (const sub of off.subOfferings) {
        recalculateSub(sub);
        if (sub.quarter !== quarter || !sub.regionalBreakdown) throw new Error('Saved practice has invalid data.');
        for (const region of Object.values(sub.regionalBreakdown)) for (const field of metricFields) {
          if (!Number.isFinite(region[field]) || region[field] < 0) throw new Error('Saved region has invalid data.');
        }
      }
    }
    actions.forEach(action => resolveAction(action, offerings));
  }
  return data;
}

export function saveDashboard(storage: Pick<Storage, 'setItem'>, data: DashboardData) {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}
