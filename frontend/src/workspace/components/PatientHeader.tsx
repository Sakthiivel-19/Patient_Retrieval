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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" /> Back to Patient Directory
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="btn-primary text-xs py-2 px-4 rounded-xl cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload New Report / Update
          </button>
        </div>
      </div>

      {/* Patient Main Demographics Card */}
      <div className="bg-white p-6 rounded-2xl relative overflow-hidden shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 font-bold font-mono text-xl shadow-2xs shrink-0">
              {patient.id}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold font-heading text-slate-900">
                  {patient.name.replace(' (Synthetic Demo)', '').replace(' (Synthetic)', '').replace(' (Security Demo)', '')}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authorized Scope
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono mt-1.5">
                <span>MRN: <strong className="text-slate-900 font-bold">{patient.mrn}</strong></span>
                <span>•</span>
                <span>DOB: <strong className="text-slate-900 font-bold">{patient.date_of_birth}</strong></span>
                <span>•</span>
                <span>Gender: <strong className="text-slate-900 font-bold">{patient.gender}</strong></span>
                {meta.blood_type && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
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
              <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs shadow-2xs">
                <div className="text-rose-700 font-bold flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Allergies Alert
                </div>
                <div className="text-slate-900 font-semibold">{meta.allergies.join(', ')}</div>
              </div>
            )}
            {meta.chronic_conditions && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs shadow-2xs">
                <div className="text-emerald-800 font-bold mb-0.5">Active Conditions</div>
                <div className="text-slate-900 font-semibold">{meta.chronic_conditions.join(', ')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Numbered Step-by-Step Guided Workflow Navigation Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-mono text-slate-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Guided Clinical Workflow
            </span>
            <span className="text-slate-500 text-[11px] font-mono font-medium">
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
                      ? 'bg-[#081F26] border-emerald-500 shadow-md ring-2 ring-emerald-500/30 text-white'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-900'
                  }`}
                >
                  {/* Step number badge & icon */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-500 text-[#081F26]'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      STEP {step.stepNum}
                    </span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>

                  {/* Title and subtitle */}
                  <div className={`font-bold text-xs leading-tight mb-0.5 ${
                    isActive ? 'text-white font-heading' : 'text-slate-900 font-heading'
                  }`}>
                    {step.title}
                  </div>
                  <div className={`text-[10px] mb-2 leading-tight font-medium ${
                    isActive ? 'text-emerald-300/90' : 'text-slate-500'
                  }`}>
                    {step.subtitle}
                  </div>

                  {/* Status chip */}
                  <div className="mt-auto w-full">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        step.alert
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
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
