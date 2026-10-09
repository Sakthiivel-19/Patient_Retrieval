import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, FileText, UserCheck, Check, HelpCircle } from 'lucide-react';
import { ConflictItem } from '../../types';
import { workspaceService } from '../services/workspaceService';

interface ConflictsPanelProps {
  patientId: string;
  onOpenDoc: (docName: string, page?: number) => void;
  onConflictResolved?: () => void;
}

export const ConflictsPanel: React.FC<ConflictsPanelProps> = ({
  patientId,
  onOpenDoc,
  onConflictResolved,
}) => {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('Resolved_B');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConflicts();
  }, [patientId]);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.getConflicts(patientId);
      setConflicts(data);
    } catch (err) {
      console.error('Failed to load conflicts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (conflictId: string) => {
    if (!resolutionNote.trim()) return;
    setSubmitting(true);
    try {
      await workspaceService.reviewConflict(patientId, conflictId, resolutionStatus, resolutionNote);
      await loadConflicts();
      if (onConflictResolved) {
        onConflictResolved();
      }
      setActiveReviewId(null);
      setResolutionNote('');
    } catch (err) {
      console.error('Failed to resolve conflict', err);
    } finally {
      setSubmitting(false);
    }
  };

  const unresolvedCount = conflicts.filter((c) => c.status === 'Needs Review').length;

  return (
    <div className="glass-panel p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-emerald-950 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" /> Clinical Contradictions & Conflict Detection
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Safety Principle: Never silently overwrite or assume. Discrepancies are flagged for explicit clinician review.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          {unresolvedCount > 0 ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 animate-pulse shadow-xs">
              {unresolvedCount} Action Required
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
              <Check className="w-4 h-4 text-emerald-700" /> All Conflicts Resolved
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 bg-emerald-50/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : conflicts.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-600">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
          No clinical conflicts or contradictions detected in this patient's records.
        </div>
      ) : (
        <div className="space-y-5">
          {conflicts.map((conf) => {
            const isUnderReview = activeReviewId === conf.id;
            const isResolved = conf.status !== 'Needs Review';

            return (
              <div
                key={conf.id}
                className={`p-5 rounded-2xl space-y-4 border-2 transition-all shadow-sm ${
                  isResolved
                    ? 'border-emerald-300 bg-white/95'
                    : 'border-rose-300 bg-rose-50/40 shadow-rose-900/5'
                }`}
              >
                {/* Conflict Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-300">
                      [{conf.id}]
                    </span>
                    <h3 className="font-bold text-slate-950 text-base font-heading">
                      {conf.conflict_type}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                      {conf.cycle_label}
                    </span>
                  </div>

                  <div>
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-400 shadow-2xs">
                        <Check className="w-4 h-4 text-emerald-700" /> {conf.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-400 animate-pulse shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-rose-700" /> Needs Clinician Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Conflicting Facts Side-by-Side — Pure High Contrast Light Theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fact A */}
                  <div className="p-4 rounded-xl bg-white border-2 border-emerald-300/90 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-emerald-100 pb-2">
                      <span className="font-bold text-emerald-900 text-xs tracking-wide flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        Fact A (Prior Document)
                      </span>
                      <button
                        onClick={() => onOpenDoc(conf.source_a_doc, conf.source_a_page)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                        title="View source document"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{conf.source_a_doc} (p. {conf.source_a_page})</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-950 font-semibold leading-relaxed font-sans pt-1">
                      {conf.fact_a}
                    </p>
                  </div>

                  {/* Fact B */}
                  <div className="p-4 rounded-xl bg-white border-2 border-amber-300/90 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-amber-100 pb-2">
                      <span className="font-bold text-amber-900 text-xs tracking-wide flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                        Fact B (Newer Report)
                      </span>
                      <button
                        onClick={() => onOpenDoc(conf.source_b_doc, conf.source_b_page)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                        title="View source document"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        <span>{conf.source_b_doc} (p. {conf.source_b_page})</span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-950 font-semibold leading-relaxed font-sans pt-1">
                      {conf.fact_b}
                    </p>
                  </div>
                </div>

                {/* Resolution Summary if already reviewed */}
                {isResolved && conf.resolution_note && (
                  <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs space-y-1.5 shadow-xs">
                    <div className="text-emerald-950 font-bold font-mono text-xs flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-700" /> Reviewed by {conf.reviewed_by || 'Staff Physician'}:
                    </div>
                    <p className="text-slate-900 font-medium text-sm leading-relaxed pl-6">{conf.resolution_note}</p>
                  </div>
                )}

                {/* Human Review Form */}
                {!isResolved && (
                  <div>
                    {!isUnderReview ? (
                      <button
                        onClick={() => {
                          setActiveReviewId(conf.id);
                          setResolutionNote('Verified with medical history and clinical logs: latest follow-up confirmed correct regimen.');
                        }}
                        className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-2 cursor-pointer font-bold"
                      >
                        <UserCheck className="w-4 h-4" /> Resolve Conflict (Human-in-the-Loop)
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border-2 border-emerald-400 space-y-3 shadow-md">
                        <div className="text-xs font-bold text-emerald-950 font-mono">
                          Clinician Decision & Resolution Rationale:
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs font-mono font-medium">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-900 hover:text-emerald-900">
                            <input
                              type="radio"
                              name={`status_${conf.id}`}
                              value="Resolved_B"
                              checked={resolutionStatus === 'Resolved_B'}
                              onChange={(e) => setResolutionStatus(e.target.value)}
                            />
                            <span className="font-bold">Accept Fact B (Newer Report)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-900 hover:text-emerald-900">
                            <input
                              type="radio"
                              name={`status_${conf.id}`}
                              value="Resolved_A"
                              checked={resolutionStatus === 'Resolved_A'}
                              onChange={(e) => setResolutionStatus(e.target.value)}
                            />
                            <span className="font-bold">Accept Fact A (Prior Document)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-slate-900 hover:text-emerald-900">
                            <input
                              type="radio"
                              name={`status_${conf.id}`}
                              value="Dismissed"
                              checked={resolutionStatus === 'Dismissed'}
                              onChange={(e) => setResolutionStatus(e.target.value)}
                            />
                            <span className="font-bold">Dismiss Discrepancy</span>
                          </label>
                        </div>

                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Enter clinical rationale and justification for medical audit..."
                          className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleReviewSubmit(conf.id)}
                            disabled={submitting || !resolutionNote.trim()}
                            className="btn-primary text-xs py-2 px-4 shadow-sm cursor-pointer font-bold"
                          >
                            {submitting ? 'Saving Resolution...' : 'Confirm Decision & Log to Audit'}
                          </button>
                          <button
                            onClick={() => setActiveReviewId(null)}
                            className="btn-secondary text-xs py-2 px-3 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
