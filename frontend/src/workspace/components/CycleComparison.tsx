import React, { useState, useEffect } from 'react';
import { GitCompare, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { CycleComparisonData } from '../../types';
import { workspaceService } from '../services/workspaceService';

interface CycleComparisonProps {
  patientId: string;
  onOpenDoc?: (docIdentifier: string) => void;
}

export const CycleComparison: React.FC<CycleComparisonProps> = ({ patientId, onOpenDoc }) => {
  const [data, setData] = useState<CycleComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, [patientId]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const res = await workspaceService.getCycleComparison(patientId);
      setData(res);
    } catch (err) {
      console.error('Failed to load cycle comparison', err);
    } finally {
      setLoading(false);
    }
  };

  const getChangeBadge = (state: string) => {
    if (state.includes('Contradict')) {
      return (
        <span className="badge-review text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-purple-700" /> Contradiction Flagged
        </span>
      );
    }
    if (state.includes('Changed') || state.includes('Pending') || state.includes('Updated')) {
      return (
        <span className="badge-pending text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" /> {state}
        </span>
      );
    }
    return (
      <span className="badge-matched text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> {state}
      </span>
    );
  };

  return (
    <div className="glass-panel p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/10 pb-4">
        <div>
          <h2 className="text-lg font-bold font-heading text-emerald-950 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-700" /> Longitudinal Clinical Cycle Comparison & Diagnostic Analytics
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Side-by-side comparative analysis of assessments, orders, and diagnostic lab reports between clinical cycles.
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold shadow-sm">
              {data.cycles_analyzed.join(' ↔ ')}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-emerald-50/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.comparison_matrix && data.comparison_matrix.length > 0 ? (
        <div className="space-y-4">
          {data.comparison_matrix.map((row, idx) => (
            <div
              key={idx}
              className="glass-card p-5 space-y-4 border border-emerald-200/80 hover:border-emerald-400/80 transition-all bg-white/95 shadow-sm"
            >
              {/* Category Title & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/10 pb-2.5">
                <h3 className="font-bold text-emerald-950 text-base flex items-center gap-2 font-heading">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  {row.category}
                </h3>
                <div>{getChangeBadge(row.change_state)}</div>
              </div>

              {/* Side by Side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cycle 1 Column */}
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-2 flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 pb-1.5">
                      <span className="font-bold uppercase tracking-wider text-emerald-800">CYCLE 1 (Baseline)</span>
                      <span className="text-slate-600 font-semibold">{row.cycle_1.date}</span>
                    </div>
                    <p className="text-xs text-slate-900 leading-relaxed font-sans font-medium">
                      {row.cycle_1.finding}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span>Status: <strong className="text-slate-900 font-bold">{row.cycle_1.status}</strong></span>
                  </div>
                </div>

                {/* Cycle 2 Column */}
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-2 flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 pb-1.5">
                      <span className="font-bold uppercase tracking-wider text-emerald-800">CYCLE 2 (Follow-up)</span>
                      <span className="text-slate-600 font-semibold">{row.cycle_2.date}</span>
                    </div>
                    <p className="text-xs text-slate-900 leading-relaxed font-sans font-medium">
                      {row.cycle_2.finding}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span>Status: <strong className="text-slate-900 font-bold">{row.cycle_2.status}</strong></span>
                  </div>
                </div>
              </div>

              {/* Clinical Significance Note & Action - High Contrast Visible Styling */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-300/80 shadow-xs">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-emerald-900 font-bold font-mono text-xs shrink-0 uppercase tracking-wide bg-emerald-200/70 px-2 py-0.5 rounded">
                    Clinical Note:
                  </span>
                  <span className="text-slate-900 font-medium font-sans text-xs">
                    {row.clinical_significance}
                  </span>
                </div>

                {onOpenDoc && (
                  <button
                    onClick={() => {
                      const targetDoc = row.document_id || row.cycle_1.document_id || row.cycle_2.document_id || row.category;
                      onOpenDoc(targetDoc);
                    }}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer font-semibold text-slate-900 hover:text-emerald-900 hover:border-emerald-500 bg-white shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" /> Inspect Evidence
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-slate-600">
          No clinical comparison cycles available.
        </div>
      )}
    </div>
  );
};
