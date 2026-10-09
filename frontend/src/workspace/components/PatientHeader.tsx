import React from 'react';
import { ShieldCheck, User, Calendar, AlertTriangle, Droplet, ArrowLeft, Upload, GitCompare, Sparkles, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { PatientBrief } from '../../types';

interface PatientHeaderProps {
  brief: PatientBrief;
  onBack: () => void;
  onOpenUpload: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  brief,
  onBack,
  onOpenUpload,
  activeTab,
  setActiveTab,
}) => {
  const { patient } = brief;
  let meta: any = {};
  try {
    meta = JSON.parse(patient.metadata_json || '{}');
  } catch {}

  const steps = [
    {
      id: 'timeline',
      stepNum: '01',
      title: 'Review History',
      subtitle: 'Longitudinal Timeline',
      icon: Calendar,
      badge: `${brief.total_events} Events`,
    },
    {
      id: 'ai',
      stepNum: '02',
      title: 'Evidence AI',
      subtitle: 'Grounded Q&A',
      icon: Sparkles,
      highlight: true,
      badge: 'Citations',
    },
    {
      id: 'reconciliation',
      stepNum: '03',
      title: 'Match Tests',
      subtitle: 'Order vs Lab Matrix',
      icon: CheckCircle2,
      badge: brief.pending_tests_count ? `${brief.pending_tests_count} Pending` : 'Reconciled',
    },
    {
      id: 'comparison',
      stepNum: '04',
      title: 'Compare Cycles',
      subtitle: 'C1 vs C2 Changes',
      icon: GitCompare,
      badge: 'Side-by-Side',
    },
    {
      id: 'conflicts',
      stepNum: '05',
      title: 'Resolve Conflicts',
      subtitle: 'Human-in-the-Loop',
      icon: AlertTriangle,
      badge: brief.unresolved_conflicts_count ? `${brief.unresolved_conflicts_count} Review` : 'Verified',
      alert: brief.unresolved_conflicts_count > 0,
    },
    {
      id: 'documents',
      stepNum: '06',
      title: 'Source Docs',
      subtitle: 'PDF Provenance',
      icon: FileText,
      badge: `${brief.total_documents} PDFs`,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Action & Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer bg-emerald-100/70 hover:bg-emerald-200/80 px-3 py-1.5 rounded-lg border border-emerald-300"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-800" /> Back to Patient Directory
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="btn-primary text-xs py-2 px-4 rounded-xl cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload New Report / Update
          </button>
        </div>
      </div>

      {/* Patient Main Demographics Card */}
      <div className="glass-panel p-6 relative overflow-hidden shadow-sm border border-emerald-200/90 bg-white/95">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-900 font-bold font-mono text-xl shadow-xs shrink-0">
              {patient.id}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold font-heading text-emerald-950">
                  {patient.name.replace(' (Synthetic Demo)', '').replace(' (Synthetic)', '').replace(' (Security Demo)', '')}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Authorized Scope
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 font-mono mt-1.5">
                <span>MRN: <strong className="text-slate-950 font-bold">{patient.mrn}</strong></span>
                <span>•</span>
                <span>DOB: <strong className="text-slate-950 font-bold">{patient.date_of_birth}</strong></span>
                <span>•</span>
                <span>Gender: <strong className="text-slate-950 font-bold">{patient.gender}</strong></span>
                {meta.blood_type && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-rose-800 font-bold">
                      <Droplet className="w-3.5 h-3.5 text-rose-600" /> Blood: {meta.blood_type}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Quick Safety Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {meta.allergies && (
              <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-300 text-xs shadow-2xs">
                <div className="text-rose-800 font-bold flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Allergies Alert
                </div>
                <div className="text-slate-900 font-semibold">{meta.allergies.join(', ')}</div>
              </div>
            )}
            {meta.chronic_conditions && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs shadow-2xs">
                <div className="text-emerald-900 font-bold mb-0.5">Active Conditions</div>
                <div className="text-slate-900 font-semibold">{meta.chronic_conditions.join(', ')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Numbered Step-by-Step Guided Workflow Navigation Ribbon */}
        <div className="mt-6 pt-5 border-t border-emerald-900/10">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-mono text-emerald-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              Guided Clinical Workflow
            </span>
            <span className="text-slate-600 text-[11px] font-mono font-medium">
              Step-by-step clinical verification sequence
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  type="button"
                  className={`flex flex-col items-start p-3 rounded-xl text-left transition-all cursor-pointer border relative overflow-hidden shadow-2xs ${
                    isActive
                      ? 'bg-gradient-to-b from-emerald-800 to-emerald-950 border-emerald-600 shadow-md ring-2 ring-emerald-500/40 text-white'
                      : 'bg-white/95 border-emerald-200/90 hover:bg-emerald-50/80 hover:border-emerald-400 text-slate-900'
                  }`}
                >
                  {/* Step number badge & icon */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-400 text-emerald-950'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      STEP {step.stepNum}
                    </span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-700'}`} />
                  </div>

                  {/* Title and subtitle - High Contrast guaranteed */}
                  <div className={`font-bold text-xs leading-tight mb-0.5 ${
                    isActive ? '!text-white font-heading text-white' : 'text-emerald-950 font-heading'
                  }`}>
                    {step.title}
                  </div>
                  <div className={`text-[10px] mb-2 leading-tight font-medium ${
                    isActive ? '!text-emerald-200 text-emerald-200' : 'text-slate-600'
                  }`}>
                    {step.subtitle}
                  </div>

                  {/* Status chip */}
                  <div className="mt-auto w-full">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        step.alert
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : isActive
                          ? 'bg-emerald-600/60 text-emerald-100 border border-emerald-400/80'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {step.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
