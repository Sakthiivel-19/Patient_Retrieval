import React, { useState, useEffect } from 'react';
import { PatientBrief, ClinicalEvent } from '../../types';
import { patientService } from '../../patients/services/patientService';
import { workspaceService } from '../services/workspaceService';
import { PatientHeader } from '../components/PatientHeader';
import { Timeline } from '../components/Timeline';
import { QuestionPanel } from '../components/QuestionPanel';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { TestMatching } from '../components/TestMatching';
import { CycleComparison } from '../components/CycleComparison';
import { ConflictsPanel } from '../components/ConflictsPanel';
import { DocumentsList } from '../components/DocumentsList';
import { ChangeSummaryModal } from '../components/ChangeSummaryModal';
import { AccessDenied } from '../../components/ui/AccessDenied';

interface PatientWorkspacePageProps {
  patientId: string;
  onBack: () => void;
}

export const PatientWorkspacePage: React.FC<PatientWorkspacePageProps> = ({
  patientId,
  onBack,
}) => {
  const [brief, setBrief] = useState<PatientBrief | null>(null);
  const [events, setEvents] = useState<ClinicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('timeline');
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  // Modals state
  const [viewingDoc, setViewingDoc] = useState<{ id: string; page?: number; excerpt?: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, [patientId]);

  const loadWorkspace = async () => {
    setLoading(true);
    setIsAccessDenied(false);
    try {
      const [briefData, eventsData] = await Promise.all([
        patientService.getPatientBrief(patientId),
        workspaceService.getTimeline(patientId),
      ]);
      setBrief(briefData);
      setEvents(eventsData);
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('Access Denied')) {
        setIsAccessDenied(true);
        setDenyReason(err.message);
      } else {
        console.error('Workspace load error', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBrief = async () => {
    try {
      const briefData = await patientService.getPatientBrief(patientId);
      setBrief(briefData);
    } catch (err) {
      console.error('Failed to refresh patient brief', err);
    }
  };

  if (isAccessDenied) {
    return <AccessDenied patientId={patientId} onBack={onBack} reason={denyReason} />;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
        <div className="h-44 glass-panel animate-pulse" />
        <div className="h-96 glass-panel animate-pulse" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center py-20">
        <p className="text-slate-400 mb-4">Patient record not found.</p>
        <button onClick={onBack} className="btn-secondary">
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      <PatientHeader
        brief={brief}
        onBack={onBack}
        onOpenUpload={() => setShowUploadModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'timeline' && (
          <Timeline
            events={events}
            onOpenDoc={(docId, page) => setViewingDoc({ id: docId, page })}
          />
        )}

        {activeTab === 'ai' && (
          <QuestionPanel
            patientId={patientId}
            onOpenCitation={(doc, page, excerpt) =>
              setViewingDoc({ id: doc, page, excerpt })
            }
          />
        )}

        {activeTab === 'reconciliation' && (
          <TestMatching
            patientId={patientId}
            onOpenDoc={(doc) => setViewingDoc({ id: doc })}
          />
        )}

        {activeTab === 'comparison' && (
          <CycleComparison
            patientId={patientId}
            onOpenDoc={(doc) => setViewingDoc({ id: doc })}
          />
        )}

        {activeTab === 'conflicts' && (
          <ConflictsPanel
            patientId={patientId}
            onOpenDoc={(doc, page) => setViewingDoc({ id: doc, page })}
            onConflictResolved={handleRefreshBrief}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsList
            patientId={patientId}
            onOpenDoc={(docId) => setViewingDoc({ id: docId })}
            onOpenUpload={() => setShowUploadModal(true)}
          />
        )}
      </div>

      {/* Step Workflow Footer Bar */}
      <div className="bg-white p-4 px-6 rounded-2xl flex items-center justify-between border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => {
            const order = ['timeline', 'ai', 'reconciliation', 'comparison', 'conflicts', 'documents'];
            const idx = order.indexOf(activeTab);
            if (idx > 0) setActiveTab(order[idx - 1]);
          }}
          disabled={activeTab === 'timeline'}
          className="btn-secondary text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          ← Previous Step
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>Workflow Progress:</span>
          <span className="text-emerald-700 font-bold">
            Step {['timeline', 'ai', 'reconciliation', 'comparison', 'conflicts', 'documents'].indexOf(activeTab) + 1} of 6
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const order = ['timeline', 'ai', 'reconciliation', 'comparison', 'conflicts', 'documents'];
            const idx = order.indexOf(activeTab);
            if (idx < order.length - 1) setActiveTab(order[idx + 1]);
          }}
          disabled={activeTab === 'documents'}
          className="btn-primary text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Next Step →
        </button>
      </div>

      {/* Modals & Drawers */}
      {viewingDoc && (
        <EvidenceViewer
          patientId={patientId}
          docIdentifier={viewingDoc.id}
          targetPage={viewingDoc.page || 1}
          highlightExcerpt={viewingDoc.excerpt}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {showUploadModal && (
        <ChangeSummaryModal
          patientId={patientId}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            loadWorkspace();
          }}
        />
      )}
    </div>
  );
};
