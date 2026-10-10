import React, { useState } from 'react';
import { Sparkles, Send, ShieldCheck, FileText, AlertCircle, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { QuestionResponse } from '../../types';
import { workspaceService } from '../services/workspaceService';

interface QuestionPanelProps {
  patientId: string;
  onOpenCitation: (docName: string, page: number, excerpt: string) => void;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({ patientId, onOpenCitation }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QuestionResponse | null>(null);
  const [error, setError] = useState('');

  const suggestedQuestions = [
    'What tests were requested during the initial consultation?',
    'What were the diagnostic results of the abdominal ultrasound?',
    'Are there any conflicting procedure dates in the record?',
    'Provide a chronological summary of clinical cycles.',
    'Helicobacter pylori test status and findings',
  ];

  const handleAsk = async (qText?: string) => {
    const q = qText || question;
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await workspaceService.askQuestion(patientId, q);
      setResponse(res);
      if (!qText) setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Error processing clinical question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* RAG Header */}
      <div className="bg-white p-6 rounded-2xl space-y-4 border border-slate-200 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                Evidence-Backed Clinical Intelligence
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Grounding Principle: <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Authorize → Retrieve → Generate → Cite</span>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Patient-Scoped Filter
          </div>
        </div>

        {/* Question Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="relative"
        >
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a natural-language clinical question about this patient's history (e.g. 'What tests were requested during the consultation?')..."
            rows={3}
            className="w-full p-3.5 pr-28 text-sm resize-none rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 font-medium focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn-primary absolute right-3 bottom-3 text-xs py-2 px-4 shadow-xs font-bold"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Retrieving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Ask AI
              </span>
            )}
          </button>
        </form>

        {/* Quick Suggested Clinical Questions */}
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
            Suggested Clinical Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAsk(sq)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 border border-slate-200 text-slate-700 font-medium transition-all text-left shadow-2xs cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold text-rose-900">Security / Query Error:</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Grounded Response View */}
      {response && (
        <div className="bg-white p-6 rounded-2xl space-y-5 border border-slate-200 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Grounded Clinical Answer
            </div>
            <div className="text-xs font-mono text-slate-500 font-medium">
              Retrieval mode: <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{response.retrieval_mode}</span>
            </div>
          </div>

          {/* Formatted Answer */}
          <div className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-slate-50/80 p-4 rounded-xl border border-slate-100">
            {response.answer}
          </div>

          {/* Sources & Citations Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-emerald-600" /> Source Evidence & Provenance Citations ({response.sources.length})
            </h3>

            {response.sources.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No citations available (Uncorroborated by uploaded records).
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.sources.map((src, i) => (
                  <div
                    key={i}
                    onClick={() => onOpenCitation(src.document, src.page, src.excerpt)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-900 font-bold mb-1.5">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          {src.document}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                          Page {src.page}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium line-clamp-3 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        "{src.excerpt}"
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-end text-xs font-semibold text-emerald-700 group-hover:underline">
                      <span>Open Document Evidence</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Boundaries & Limitations Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-slate-500 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Clinical AI Safety Boundary: </span>
              CareLens AI is an evidence retrieval assistant. All diagnoses and orders must be independently verified by medical professionals.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
