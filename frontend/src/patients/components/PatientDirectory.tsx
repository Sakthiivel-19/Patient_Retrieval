import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, ShieldCheck, ArrowRight, Stethoscope, RefreshCw, Lock } from 'lucide-react';
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
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPatients();
  }, [currentUser]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.listPatients();
      // Strictly filter to only assigned/authorized patients for clinicians
      const assignedOnly = data.filter((p) => p.has_grant);
      setPatients(assignedOnly);
    } catch (err) {
      console.error('Failed to load assigned patients', err);
    } finally {
      setLoading(false);
    }
  };

  const displayedPatients = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-700 uppercase tracking-wider font-bold">
              My Clinical Queue
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
            <Stethoscope className="w-6 h-6 text-emerald-600" />
            My Assigned Patients
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              {patients.length} Active Charts
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Active clinical charts authorized for <strong className="text-slate-900 font-bold">{currentUser.full_name}</strong> ({currentUser.email}).
          </p>
        </div>

        <button
          onClick={loadPatients}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-2 shrink-0 cursor-pointer self-start md:self-auto font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your assigned patients by name, MRN, or Patient ID..."
            className="input-field pl-10 py-3 text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 w-full rounded-xl shadow-2xs"
          />
        </div>
      </div>

      {/* Assigned Patients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-100/70 rounded-2xl animate-pulse h-56 border border-slate-200" />
          ))}
        </div>
      ) : displayedPatients.length === 0 ? (
        <div className="bg-white p-10 text-center space-y-3 border border-dashed border-slate-200 rounded-2xl shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-500">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {search ? 'No Matching Assigned Patients Found' : 'No Patients Currently Assigned to Your Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            {search
              ? `No assigned patient records matched "${search}".`
              : `You currently do not have any patient charts assigned under ${currentUser.email}. The hospital administrator can assign patient charts to your clinical profile.`}
          </p>
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
                className="p-5 rounded-2xl cursor-pointer relative overflow-hidden flex flex-col justify-between group transition-all border border-slate-200/90 hover:border-emerald-500 hover:shadow-md bg-white shadow-xs"
              >
                {/* Header & ID */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold font-mono text-sm border bg-slate-50 text-slate-800 border-slate-200">
                        {patient.id}
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-heading text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          {patient.name.replace(' (Synthetic Demo)', '').replace(' (Synthetic)', '').replace(' (Security Demo)', '')}
                        </h3>
                        <p className="text-xs font-mono text-slate-500 font-medium mt-0.5">
                          {patient.mrn} • {patient.gender}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authorized
                    </span>
                  </div>

                  {/* Metadata details */}
                  <div className="space-y-2 text-xs text-slate-800 my-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth:
                      </span>
                      <span className="font-mono text-slate-900 font-bold">{patient.date_of_birth}</span>
                    </div>
                    {conditionsList.length > 0 && (
                      <div className="text-xs pt-1.5 border-t border-slate-200/60 font-sans">
                        <span className="text-slate-500 font-medium">Conditions: </span>
                        <span className="text-slate-900 font-semibold">{conditionsList.join(', ')}</span>
                      </div>
                    )}
                    {allergiesList.length > 0 && (
                      <div className="text-xs">
                        <span className="text-rose-700 font-bold">Allergies: </span>
                        <span className="text-slate-900 font-semibold">{allergiesList.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                  <span className="text-emerald-700 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    Open Patient Workspace <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
