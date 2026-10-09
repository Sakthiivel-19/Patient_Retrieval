import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, ShieldCheck, ShieldAlert, FileText, ArrowRight, Activity, Lock, Stethoscope, RefreshCw, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { Patient, User as UserType } from '../../types';
import { patientService } from '../services/patientService';

interface PatientDirectoryProps {
  currentUser: UserType;
  onSelectPatient: (patientId: string) => void;
  onOpenSecurityDemo: () => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  currentUser,
  onSelectPatient,
  onOpenSecurityDemo,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isDoctor = currentUser.role?.toLowerCase() === 'doctor' || currentUser.role?.toLowerCase() === 'reviewer';
  const [activeTab, setActiveTab] = useState<'assigned' | 'all'>(isDoctor ? 'assigned' : 'all');

  useEffect(() => {
    loadPatients();
  }, [currentUser]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.listPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  const assignedCount = patients.filter((p) => p.has_grant).length;
  const totalCount = patients.length;

  const displayedPatients = patients.filter((p) => {
    if (activeTab === 'assigned' && !p.has_grant) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header Banner with Clinician Context */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border-2 border-emerald-300 bg-white/95">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-xs font-mono text-emerald-900 uppercase tracking-wider font-bold">
              {isDoctor ? 'Clinician Dashboard & Assigned Queue' : 'Authorized Patient Directory'}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-emerald-950 flex items-center gap-2.5">
            <Stethoscope className="w-6 h-6 text-emerald-700" />
            {isDoctor ? `${currentUser.full_name}'s Clinical Dashboard` : 'Clinical Patient Directory'}
          </h1>
          <p className="text-xs text-slate-700 font-medium mt-1">
            Pre-retrieval access enforcement: Viewing records authorized for <strong className="text-emerald-950 font-bold">{currentUser.email}</strong> under role <span className="font-mono text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">"{currentUser.role}"</span>.
          </p>
        </div>

        <button
          onClick={loadPatients}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-2 shrink-0 cursor-pointer self-start md:self-auto font-bold text-slate-900 bg-white hover:bg-emerald-50 border border-emerald-300 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-2xs space-y-1">
          <div className="text-slate-600 font-bold flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Assigned to You
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-950">
            {assignedCount} Charts
          </div>
          <div className="text-[11px] text-slate-600 font-sans font-medium">Explicit patient grants</div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-2xs space-y-1">
          <div className="text-slate-600 font-bold flex items-center gap-1.5 text-xs">
            <FileText className="w-4 h-4 text-emerald-700" /> Hospital Registry
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-950">
            {totalCount} Patients
          </div>
          <div className="text-[11px] text-slate-600 font-sans font-medium">Total registered charts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="text-slate-600 font-bold flex items-center gap-1.5 text-xs">
            <Lock className="w-4 h-4 text-emerald-700" /> Security Guard
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Active
          </div>
          <div className="text-[11px] text-slate-600 font-sans font-medium">Pre-retrieval enforcement</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-heading transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-white text-slate-800 hover:bg-emerald-50 hover:text-emerald-950 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> My Assigned Patients ({assignedCount})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-heading transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-white text-slate-800 hover:bg-emerald-50 hover:text-emerald-950 border border-emerald-200'
            }`}
          >
            <Filter className="w-4 h-4" /> All Hospital Patients ({totalCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, MRN, or ID..."
            className="input-field pl-10 py-2.5 text-xs shadow-xs bg-white border-2 border-emerald-200 text-slate-900 placeholder:text-slate-500 font-medium focus:border-emerald-500 w-full"
          />
        </div>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-emerald-50/60 rounded-2xl animate-pulse h-56 border border-emerald-200" />
          ))}
        </div>
      ) : displayedPatients.length === 0 ? (
        <div className="glass-panel p-10 text-center space-y-3 border-2 border-dashed border-emerald-300 bg-white/95 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center text-emerald-700">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-emerald-950">
            {activeTab === 'assigned'
              ? 'No Patients Currently Assigned to Your Account'
              : 'No Patient Records Found'}
          </h3>
          <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
            {activeTab === 'assigned'
              ? `You currently do not have explicit patient grants under '${currentUser.email}'. The hospital administrator can assign patient charts to your clinical profile.`
              : 'No matching patient records were found in the hospital registry.'}
          </p>
          {activeTab === 'assigned' && totalCount > 0 && (
            <button
              onClick={() => setActiveTab('all')}
              className="btn-secondary text-xs mt-2 inline-flex items-center gap-2 cursor-pointer font-bold"
            >
              <Filter className="w-3.5 h-3.5" /> View All Hospital Patients ({totalCount})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedPatients.map((patient) => {
            let meta: any = {};
            try {
              meta = JSON.parse(patient.metadata_json || '{}');
            } catch {}

            const conditionsList = meta.chronic_conditions || meta.conditions || [];
            const allergiesList = meta.allergies || [];

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className={`p-5 rounded-2xl cursor-pointer relative overflow-hidden flex flex-col justify-between group transition-all border-2 bg-white shadow-xs ${
                  !patient.has_grant
                    ? 'border-rose-300 bg-rose-50/30 hover:border-rose-500 hover:bg-rose-50/60'
                    : 'border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/30'
                }`}
              >
                {/* Authorization Status Chip & Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold font-mono text-sm shadow-2xs border ${
                        patient.has_grant
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                          : 'bg-rose-100 text-rose-950 border-rose-300'
                      }`}>
                        {patient.id}
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-heading text-slate-950 group-hover:text-emerald-900 transition-colors leading-snug">
                          {patient.name.replace(' (Synthetic Demo)', '').replace(' (Synthetic)', '').replace(' (Security Demo)', '')}
                        </h3>
                        <p className="text-xs font-mono text-slate-600 font-semibold mt-0.5">
                          {patient.mrn} • {patient.gender}
                        </p>
                      </div>
                    </div>

                    {patient.has_grant ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" /> Authorized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
                        <Lock className="w-3 h-3 text-rose-700" /> No Grant
                      </span>
                    )}
                  </div>

                  {/* Metadata details — High Contrast Light Box */}
                  <div className="space-y-2 text-xs text-slate-900 my-4 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date of Birth:
                      </span>
                      <span className="font-mono text-slate-950 font-bold">{patient.date_of_birth}</span>
                    </div>
                    {conditionsList.length > 0 && (
                      <div className="text-xs pt-1.5 border-t border-emerald-200 font-sans">
                        <span className="text-slate-700 font-medium">Conditions: </span>
                        <span className="text-slate-950 font-bold">{conditionsList.join(', ')}</span>
                      </div>
                    )}
                    {allergiesList.length > 0 && (
                      <div className="text-xs">
                        <span className="text-rose-900 font-bold">Allergies: </span>
                        <span className="text-slate-950 font-bold">{allergiesList.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs font-bold">
                  {patient.has_grant ? (
                    <span className="text-emerald-800 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      Open Patient Workspace <ArrowRight className="w-4 h-4 text-emerald-700" />
                    </span>
                  ) : (
                    <span className="text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-700" /> Test Access Guard (403)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
