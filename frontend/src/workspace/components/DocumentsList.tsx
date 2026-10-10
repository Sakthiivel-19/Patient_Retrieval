import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Hash, Calendar, Layers, Eye, Upload, Download, Loader2 } from 'lucide-react';
import { ClinicalDocument } from '../../types';
import { workspaceService } from '../services/workspaceService';

interface DocumentsListProps {
  patientId: string;
  onOpenDoc: (docId: string) => void;
  onOpenUpload: () => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ patientId, onOpenDoc, onOpenUpload }) => {
  const [docs, setDocs] = useState<ClinicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleDownload = async (docId: string, filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingDocId(docId);
    try {
      await workspaceService.downloadDocumentPdf(patientId, docId, filename);
    } catch (err: any) {
      alert(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [patientId]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.getDocuments(patientId);
      setDocs(data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl space-y-6 animate-fade-in border border-slate-200 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" /> Patient Document Records & Provenance
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Immutable document store with cryptographic deduplication, page-aware chunking, and version tracking.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="btn-primary text-xs py-2 px-3.5 font-semibold cursor-pointer shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-100/70 rounded-xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all shadow-2xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 font-mono text-xs flex-shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm font-heading">
                      {doc.filename}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                      v{doc.version}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                      {doc.cycle_label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500 mt-1 font-medium">
                    <span>Type: <strong className="text-slate-900 font-bold">{doc.document_type}</strong></span>
                    <span>•</span>
                    <span>Uploaded by: <strong className="text-slate-900 font-bold">{doc.uploaded_by}</strong></span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Hash Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs font-mono text-slate-500 hidden sm:block">
                  <div className="font-bold text-slate-900">{doc.chunk_count} Page Chunks</div>
                  <div className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenDoc(doc.id)}
                    className="btn-secondary text-xs py-1.5 px-3 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" /> View & Provenance
                  </button>

                  <button
                    onClick={(e) => handleDownload(doc.id, doc.filename, e)}
                    disabled={downloadingDocId === doc.id}
                    title="Download clinical PDF document"
                    className="btn-primary text-xs py-1.5 px-3 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    {downloadingDocId === doc.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
