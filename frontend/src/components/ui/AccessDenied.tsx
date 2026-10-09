import React from 'react';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  patientId: string;
  onBack: () => void;
  reason?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ patientId, onBack, reason }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
        <ShieldAlert className="w-10 h-10 text-rose-700" />
      </div>

      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-950 text-xs font-mono font-bold uppercase tracking-wider mb-4">
        <Lock className="w-3.5 h-3.5 text-rose-700" /> Security Guard Policy: 403 Forbidden
      </div>

      <h2 className="text-2xl font-bold font-heading text-slate-950 mb-2">
        Access Denied to Patient Record ({patientId})
      </h2>
      
      <p className="max-w-md text-sm text-slate-800 font-medium mb-6">
        {reason ||
          `You do not have an active patient-level grant to view or query records for patient "${patientId}". This attempt has been permanently recorded in the immutable audit security trail.`}
      </p>

      <div className="p-4 rounded-xl bg-white border-2 border-rose-200 text-left text-xs font-mono text-slate-900 max-w-lg w-full mb-8 shadow-sm">
        <div className="text-rose-900 font-bold mb-1 flex items-center gap-1.5">
          <span>●</span> SECURITY INTEGRITY RULE ENFORCED:
        </div>
        <p className="text-slate-800 font-medium">
          "Authorization must happen before clinical information enters the retrieval pipeline. Unauthorized records never enter LLM context."
        </p>
      </div>

      <button onClick={onBack} className="btn-secondary font-bold">
        <ArrowLeft className="w-4 h-4" /> Return to Patient Directory
      </button>
    </div>
  );
};
