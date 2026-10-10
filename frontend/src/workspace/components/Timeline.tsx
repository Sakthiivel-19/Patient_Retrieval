import React from 'react';
import { Calendar, FileText, Stethoscope, TestTube2, Scissors, CheckCircle, ExternalLink } from 'lucide-react';
import { ClinicalEvent } from '../../types';

interface TimelineProps {
  events: ClinicalEvent[];
  onOpenDoc: (docId: string, page?: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ events, onOpenDoc }) => {
  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation':
        return <Stethoscope className="w-4 h-4 text-emerald-800" />;
      case 'test requested':
        return <TestTube2 className="w-4 h-4 text-amber-800" />;
      case 'lab result':
        return <CheckCircle className="w-4 h-4 text-emerald-800" />;
      case 'procedure':
        return <Scissors className="w-4 h-4 text-purple-800" />;
      default:
        return <FileText className="w-4 h-4 text-blue-800" />;
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'test requested':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'lab result':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'procedure':
        return 'bg-purple-100 text-purple-950 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl space-y-6 animate-fade-in border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" /> Chronological Clinical Timeline
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Immutable longitudinal record reconstructed from verified clinical reports and consultations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            {events.length} Recorded Events
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 my-4">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 font-heading">No Clinical Events Recorded Yet</h4>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            This newly registered patient chart currently has no timeline events. Upload consultation notes or clinical documents in Tab 6 ("Source Docs") to extract longitudinal timeline events.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-emerald-200 space-y-6 my-4 ml-4">
          {events.map((ev, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline node icon */}
              <div className="absolute -left-[35px] top-2 w-8 h-8 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                {getEventIcon(ev.event_type)}
              </div>

              {/* Event Card */}
              <div className="p-4 ml-2 space-y-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-xs transition-all shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getEventBadgeClass(ev.event_type)}`}>
                      {ev.event_type}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {ev.cycle_label}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {ev.event_date}
                  </span>
                </div>

                <p className="text-sm text-slate-800 font-medium leading-relaxed font-sans">
                  {ev.description}
                </p>

                {ev.document_id && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Source Doc: <strong className="text-slate-800 font-bold">{ev.document_id}</strong> (p. {ev.source_page})
                    </span>
                    <button
                      onClick={() => onOpenDoc(ev.document_id!, ev.source_page)}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" /> View Source Evidence
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
