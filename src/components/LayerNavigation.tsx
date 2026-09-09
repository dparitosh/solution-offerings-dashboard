import React from 'react';
import {
  BarChart3,
  Globe2,
  AlertOctagon,
  UserCheck,
  TrendingDown,
  Target,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Offering, RemedialAction } from '../types/dashboard';

export type LayerId = 'layer1_executive' | 'layer2_regional' | 'layer3_pipeline_gaps' | 'layer4_owner_tcv';

interface LayerNavigationProps {
  activeLayer: LayerId;
  setActiveLayer: (layer: LayerId) => void;
  offerings?: Offering[];
  actions?: RemedialAction[];
}

export const LayerNavigation: React.FC<LayerNavigationProps> = ({
  activeLayer,
  setActiveLayer,
}) => {
  const layers = [
    {
      id: 'layer1_executive' as LayerId,
      title: 'Dashboard',
      subtitle: 'Portfolio AOP vs Actuals • Hierarchical Offering Rollups',
      icon: BarChart3,
    },
    {
      id: 'layer2_regional' as LayerId,
      title: 'Geography View',
      subtitle: 'NA • EMEA • APAC • LATAM Geographic Performance Matrix',
      icon: Globe2,
    },
    {
      id: 'layer3_pipeline_gaps' as LayerId,
      title: 'Pipeline Gaps & Remedial Actions',
      subtitle: 'Root Cause Diagnosis • Remedial Initiatives • Recovery Simulator',
      icon: AlertOctagon,
    },
    {
      id: 'layer4_owner_tcv' as LayerId,
      title: 'TCV Gaps & Remedial Actions',
      subtitle: 'Owner-by-Owner Scorecards • TCV Target Remediation • Win Strategies',
      icon: UserCheck,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 py-3">
          {layers.map(layer => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;

            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`relative flex items-start gap-3 text-left p-3 rounded-xl border transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-b from-blue-50/90 to-indigo-50/40 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1">
                    {layer.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {layer.subtitle}
                  </div>
                </div>

                {isActive && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
