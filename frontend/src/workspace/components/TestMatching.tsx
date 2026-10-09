import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, HelpCircle, FileText, Check, Filter, AlertTriangle, ExternalLink, Activity } from 'lucide-react';
import { ReconciliationSummary, ReconciliationItem } from '../../types';
import { workspaceService } from '../services/workspaceService';

interface TestMatchingProps {
  patientId: string;
  onOpenDoc: (docName: string) => void;
}

export const TestMatching: React.FC<TestMatchingProps> = ({ patientId, onOpenDoc }) => {
  const [data, setData] = useState<ReconciliationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadReconciliation();
  }, [patientId]);

  const loadReconciliation = async () => {
    setLoading(true);
    try {
      const summary = await workspaceService.getReconciliation(patientId);
      setData(summary);
    } catch (err) {
      console.error('Failed to load test matching data', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Matched':
        return (
          <span className="badge-matched inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Matched
          </span>
        );
      case 'Recorded Pending':
        return (
          <span className="badge-pending inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Recorded Pending
          </span>
        );
      case 'Result not found':
        return (
          <span className="badge-missing inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> Result Not Found
          </span>
        );
      case 'Needs review':
      default:
        return (
          <span className="badge-review inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-purple-700" /> Needs Review
          </span>
        );
    }
  };

  const filteredItems = data?.items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'matched') return item.status === 'Matched';
    if (filter === 'pending') return item.status === 'Recorded Pending';
    if (filter === 'missing') return item.status === 'Result not found';
    return true;
  }) || [];

  return (
    <div className="glass-panel p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/10 pb-4">
        <div>
          <h2 className="text-lg font-bold font-heading text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" /> Test Request → Result Matching & Lab Analyzer
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Reconciliation engine verifies diagnostic reports against orders. Click any report to inspect the verified values and full text.
          </p>
        </div>

        {/* Status Metrics Ribbon */}
        {data && (
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold shadow-xs">
              {data.matched_count} Matched
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-xs">
              {data.pending_count} Pending
            </span>
            <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-semibold shadow-xs">
              {data.missing_count} Missing Results
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-700 font-medium flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5 text-emerald-700" /> Filter by State:
        </span>
        {['all', 'matched', 'pending', 'missing'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer font-medium ${
              filter === f
                ? 'bg-emerald-700 text-white font-semibold shadow-sm'
                : 'text-slate-700 hover:text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            {f === 'missing' ? 'Result Not Found' : f}
          </button>
        ))}
      </div>

      {/* Reconciliation Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-emerald-50/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-600">
          No test records match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isMatched = item.status === 'Matched';
            const isAbnormal = item.is_abnormal;

            return (
              <div
                key={item.request_id}
                className={`glass-card p-5 space-y-4 transition-all border bg-white/95 shadow-sm ${
                  isMatched
                    ? isAbnormal
                      ? 'border-amber-400/80 bg-amber-50/30'
                      : 'border-emerald-300/90 bg-emerald-50/20'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isMatched ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold font-heading text-emerald-950">
                          {item.test_name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
                          {item.cycle_label}
                        </span>
                        {isAbnormal && (
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Attention Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Side-by-side Order vs Result Inspection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Requisition Order Side */}
                  <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/90 space-y-2 flex flex-col justify-between shadow-xs">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider font-mono flex items-center justify-between">
                        <span>Clinical Requisition Order</span>
                        <span className="text-slate-500 text-[10px]">{item.request_id}</span>
                      </div>
                      <div className="text-slate-800 font-mono text-xs">
                        Ordered Date: <strong className="text-slate-950 font-bold">{item.requested_date}</strong>
                      </div>
                      {item.request_document && (
                        <div className="text-slate-600 text-xs flex items-center gap-1.5 pt-1">
                          <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">Source: {item.request_document}</span>
                        </div>
                      )}
                    </div>

                    {item.request_document && (
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          onClick={() => onOpenDoc(item.request_doc_id || item.request_document || '')}
                          className="text-xs font-mono text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> View Order Consultation Note
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Diagnostic Lab Outcome Side */}
                  <div className={`p-4 rounded-xl border space-y-2 flex flex-col justify-between shadow-xs ${
                    isMatched
                      ? isAbnormal
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-slate-50/90 border-slate-200'
                  }`}>
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider font-mono flex items-center justify-between">
                        <span>Verified Diagnostic Report Outcome</span>
                        {item.result_date && (
                          <span className="text-slate-600 text-[11px] font-mono font-semibold">{item.result_date}</span>
                        )}
                      </div>

                      {item.result_data ? (
                        <div className="space-y-1.5">
                          <div className="text-slate-950 font-mono font-bold text-xs bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                            {item.result_data}
                          </div>

                          {item.reference_range && (
                            <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1">
                              <span>Ref Range:</span>
                              <strong className="text-slate-900 font-semibold">{item.reference_range}</strong>
                            </div>
                          )}

                          {item.result_document && (
                            <div className="text-slate-600 text-[11px] font-mono flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="truncate">Doc: {item.result_document}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-600 text-xs italic bg-white/80 p-2.5 rounded-lg border border-slate-200">
                          {item.evidence || 'No corresponding diagnostic report received yet.'}
                        </div>
                      )}
                    </div>

                    {item.result_document && (
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          onClick={() => onOpenDoc(item.result_doc_id || item.result_document || '')}
                          className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-mono cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" /> Inspect Full Lab Report & Evidence
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
