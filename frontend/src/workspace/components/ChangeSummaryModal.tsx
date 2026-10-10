import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { workspaceService } from '../services/workspaceService';

interface ChangeSummaryModalProps {
  patientId: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

export const ChangeSummaryModal: React.FC<ChangeSummaryModalProps> = ({
  patientId,
  onClose,
  onUploadComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [cycleLabel, setCycleLabel] = useState('Cycle 2');
  const [docType, setDocType] = useState('Pathology & Biopsy Report');
  const [uploading, setUploading] = useState(false);
  const [ingestionStep, setIngestionStep] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sampleReportText = `CareLens Pathology & Molecular Diagnostics
PATIENT: Eleanor Vance | MRN: MRN-849201 | DOB: 1978-04-12
Date of Specimen: 2026-02-18 | Accession #: PATH-2026-8841
Ordering Physician: Dr. Sarah Miller, MD

PATHOLOGY REPORT & NEW RECONCILIATION DATA:

1. Clinical Test Result: Helicobacter pylori Stool Antigen & Biopsy Urease
   - Result: Negative for H. pylori antigen.
   - Status: COMPLETED / RESOLVED
   - Finding: No Helicobacter-like organisms identified on Giemsa stain.

2. Clinical Test Result: Complete Blood Count (CBC) Repeat
   - Result: Hemoglobin 14.1 g/dL, Platelets 255,000 /mcL, WBC 7.1 x10^3/mcL
   - Status: COMPLETED [Normal Limits]

3. Procedure Verification Note:
   - Note: Verified endoscopy procedure log confirms procedure was conducted on 2026-01-15 after rescheduled prep from original 2026-01-10 booking.`;

  const handleUseSample = () => {
    setErrorMessage(null);
    const blob = new Blob([sampleReportText], { type: 'text/plain' });
    const sampleFile = new File([blob], 'pathology_biopsy_update_cycle2.pdf', { type: 'application/pdf' });
    setFile(sampleFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setErrorMessage(null);
    setIngestionStep('Validating file & calculating SHA-256 hash...');

    setTimeout(async () => {
      try {
        setIngestionStep('Extracting page-aware text & generating embeddings...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('cycle_label', cycleLabel);
        formData.append('document_type', docType);

        const res = await workspaceService.uploadDocument(patientId, formData);
        setResult(res);
        onUploadComplete();
      } catch (err: any) {
        setErrorMessage(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-slate-950">
                Upload New Clinical Report & Reconcile
              </h3>
              <p className="text-xs text-slate-700 font-mono font-medium">
                Compare → Verify → Update Workflow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-950 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!result ? (
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Preset Sample Quick Select */}
              <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Ready-to-Test Demo Scenario:
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    Auto-load synthetic Cycle 2 Pathology & Biopsy Report to resolve pending tests & verify history update.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseSample}
                  className="btn-secondary text-xs py-1.5 px-3 bg-white text-emerald-950 border-emerald-300 hover:bg-emerald-50 font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Load Sample Report
                </button>
              </div>

              {/* File Input Box */}
              <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-white transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
                  <FileText className="w-10 h-10 text-emerald-700 mx-auto opacity-80" />
                  {file ? (
                    <div className="text-xs font-mono font-bold text-emerald-950">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-slate-950">
                        Drop clinical PDF report here or click to browse
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                        Supports PDF and clinical consultation notes
                      </div>
                    </>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Clinical Cycle
                  </label>
                  <select
                    value={cycleLabel}
                    onChange={(e) => setCycleLabel(e.target.value)}
                    className="input-field text-xs py-2 bg-white text-slate-950 border-emerald-300 font-medium"
                  >
                    <option value="Cycle 1">Cycle 1 (Initial Intake)</option>
                    <option value="Cycle 2">Cycle 2 (Follow-up & Diagnostics)</option>
                    <option value="Cycle 3">Cycle 3 (Longitudinal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Document Category
                  </label>
                  <input
                    type="text"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="input-field text-xs py-2 bg-white text-slate-950 border-emerald-300 font-medium"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-xs text-red-950 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {uploading ? (
                <div className="p-4 rounded-xl bg-white border-2 border-emerald-300 text-xs text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-950 font-bold font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" /> {ingestionStep}
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    Preserving provenance • Calculating SHA256 • Matching pending orders
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!file}
                  className="btn-primary w-full justify-center py-2.5 mt-2 font-bold"
                >
                  <Upload className="w-4 h-4" /> Process & Reconcile History
                </button>
              )}
            </form>
          ) : (
            /* Change Detection Result Screen */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-2 text-emerald-950 font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Document Ingested & Versioned Successfully!
                </div>
                <div className="text-slate-900 text-xs font-medium">
                  Document ID: <span className="font-mono font-bold text-emerald-950">{result.document_id}</span> ({result.chunks_count} chunks embedded with page provenance).
                </div>
              </div>

              {/* Signature Change Detection Summary */}
              <div className="bg-white p-4 space-y-3 border-2 border-emerald-200 rounded-xl shadow-sm">
                <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" /> Reconciliation & Change Summary
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* New Facts */}
                  {result.changes?.new_facts?.map((nf: string, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold flex items-start gap-2">
                      <span className="font-bold text-emerald-700">+</span>
                      <span>{nf}</span>
                    </div>
                  ))}

                  {/* Changed Facts */}
                  {result.changes?.changed_facts?.map((cf: string, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-950 font-semibold flex items-start gap-2">
                      <span className="font-bold text-amber-700">~</span>
                      <span>{cf}</span>
                    </div>
                  ))}

                  {/* Conflicts Flagged */}
                  {result.changes?.conflicts_detected?.map((c: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-950 font-semibold flex items-start gap-2">
                      <span className="font-bold text-rose-700">!</span>
                      <span>Conflict Detected: {c.conflict_type} (Flagged for Human Review)</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onClose}
                className="btn-primary w-full justify-center py-2.5 font-bold"
              >
                Done • View Updated Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
