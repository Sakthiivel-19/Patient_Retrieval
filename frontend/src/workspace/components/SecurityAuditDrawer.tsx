import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Lock, Activity, RefreshCw, Key, UserCheck, ShieldAlert, Filter, Search, Clock, FileText } from 'lucide-react';
import { AuditEventItem } from '../../types';
import { workspaceService } from '../services/workspaceService';

interface SecurityAuditDrawerProps {
  patientId?: string;
  onClose: () => void;
}

export const SecurityAuditDrawer: React.FC<SecurityAuditDrawerProps> = ({ patientId, onClose }) => {
  const [logs, setLogs] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, [patientId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.getAuditLogs(patientId);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('DENIED') || action.includes('FAILED') || action.includes('BLOCKED')) {
      return 'text-rose-950 bg-rose-100 border-rose-300 font-bold';
    }
    if (action.includes('RAG') || action.includes('QUESTION') || action.includes('QUERY')) {
      return 'text-cyan-950 bg-cyan-100 border-cyan-300 font-bold';
    }
    if (action.includes('UPLOAD') || action.includes('REVIEW') || action.includes('MATCH')) {
      return 'text-amber-950 bg-amber-100 border-amber-300 font-bold';
    }
    return 'text-emerald-950 bg-emerald-100 border-emerald-300 font-bold';
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      filterAction === 'ALL' ||
      (filterAction === 'DENIED' && (log.action.includes('DENIED') || log.action.includes('BLOCKED'))) ||
      (filterAction === 'RAG' && (log.action.includes('RAG') || log.action.includes('QUESTION'))) ||
      (filterAction === 'AUTH' && (log.action.includes('AUTH') || log.action.includes('LOGIN') || log.action.includes('VIEW')));

    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.patient_id && log.patient_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.metadata_json && log.metadata_json.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border-2 border-emerald-300 shadow-2xl overflow-hidden bg-white">
        {/* Header */}
        <div className="p-5 px-6 border-b border-emerald-200 flex items-center justify-between bg-emerald-50/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-900 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-emerald-950">
                  Security & Access Audit Trail
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                  {logs.length} Events Logged
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono mt-0.5 font-medium">
                Immutable ledger of clinical accesses, RBAC checks, & RAG questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              className="p-2 text-slate-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer border border-emerald-200"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-700 hover:text-rose-900 hover:bg-rose-100 rounded-xl transition-all cursor-pointer border border-transparent"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-4 px-6 border-b border-emerald-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'RAG', label: 'RAG Q&A' },
              { id: 'DENIED', label: 'Security Blocks' },
              { id: 'AUTH', label: 'Logins & Views' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterAction(f.id)}
                className={`px-3 py-1 text-xs rounded-lg font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  filterAction === f.id
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                    : 'text-slate-700 hover:text-emerald-950 hover:bg-emerald-50 border-slate-200 bg-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search bar inside Audit Modal */}
          <div className="relative w-full sm:w-64 flex items-center">
            <Search className="w-3.5 h-3.5 text-emerald-700 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail..."
              className="input-field pl-8 py-1.5 text-xs bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* Audit Events List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-slate-50/50">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 bg-white rounded-xl animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900">No matching audit records</p>
              <p className="text-xs text-slate-600">Try adjusting your search filter or action criteria.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              let meta: any = {};
              try {
                meta = JSON.parse(log.metadata_json || '{}');
              } catch {}

              return (
                <div
                  key={log.id}
                  className="p-4 space-y-2 border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all rounded-xl bg-white shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-slate-600 font-bold text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-950 flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-emerald-950 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {log.resource}
                    </span>
                    <span className="text-slate-800 text-xs font-semibold">
                      User: <strong className="text-slate-950 font-bold">{log.user_name || `User #${log.user_id}`}</strong>
                    </span>
                  </div>

                  {log.patient_id && (
                    <div className="text-xs font-mono text-slate-700 font-medium">
                      Patient Scope: <span className="text-slate-950 font-bold">{log.patient_id}</span> • IP Address: <span className="text-slate-800 font-semibold">{log.ip_address || '127.0.0.1'}</span>
                    </div>
                  )}

                  {Object.keys(meta).length > 0 && (
                    <div className="text-xs font-mono text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed overflow-x-auto">
                      {meta.question ? (
                        <div>
                          <span className="text-emerald-950 font-bold">Query:</span> "{meta.question}"
                          <div className="text-slate-600 text-[11px] mt-0.5 font-medium">
                            Citations: {meta.sources_count} • Chunks: {meta.retrieval_chunks_count}
                          </div>
                        </div>
                      ) : meta.reason ? (
                        <div>
                          <span className="text-rose-950 font-bold">Reason:</span> {meta.reason}
                          {meta.user_role && <span> • Attempted Role: {meta.user_role}</span>}
                        </div>
                      ) : (
                        JSON.stringify(meta)
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-emerald-200 bg-emerald-50/80 text-xs font-mono text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-950 font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-700" /> CliniTrace Immutable Architecture Verified
          </span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-4 rounded-lg cursor-pointer font-bold text-slate-900 bg-white hover:bg-emerald-100 border border-emerald-300"
          >
            Close Trail
          </button>
        </div>
      </div>
    </div>
  );
};
