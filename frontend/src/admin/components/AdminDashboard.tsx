import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Key,
  Activity,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  RefreshCw,
  Clock,
  FileText,
  Stethoscope,
  Building2,
  Database,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Check,
  Plus,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import {
  adminService,
  AdminUser,
  AdminGrant,
  DoctorActivity,
  CreateDoctorPayload,
  CreatePatientPayload
} from '../services/adminService';
import { patientService } from '../../patients/services/patientService';
import { Sparkles, UserCheck as PatientIcon } from 'lucide-react';

interface AdminDashboardProps {
  onOpenPatientWorkspace?: (patientId: string, doctorEmail?: string) => void;
  onSwitchToDoctor?: (doctorEmail: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenPatientWorkspace,
  onSwitchToDoctor,
}) => {
  const [activeTab, setActiveTab] = useState<'inspect-doctor' | 'activity' | 'new-doctor' | 'new-patient'>('inspect-doctor');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [grants, setGrants] = useState<AdminGrant[]>([]);
  const [activities, setActivities] = useState<DoctorActivity[]>([]);
  const [livePatients, setLivePatients] = useState<any[]>([]);

  // Selected Doctor for Profile Inspection (null = show all doctors directory; number = show that doctor's dedicated page)
  const [inspectedDoctorId, setInspectedDoctorId] = useState<number | null>(null);

  // Filters
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Doctor Form State
  const [newDoctor, setNewDoctor] = useState<CreateDoctorPayload>({
    full_name: '',
    email: '',
    password: 'password123',
    department: 'Gastroenterology',
    license_number: 'MD-CL-2026',
    role: 'doctor',
  });
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  const [doctorSuccessMsg, setDoctorSuccessMsg] = useState('');
  const [doctorErrorMsg, setDoctorErrorMsg] = useState('');

  // New Patient Form State
  const [newPatient, setNewPatient] = useState<CreatePatientPayload>({
    id: '',
    name: '',
    mrn: '',
    date_of_birth: '',
    gender: 'Female',
    conditions: '',
    allergies: '',
    assigned_doctor_ids: [],
    permissions: 'read,write,query,reconcile',
  });
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [patientSuccessMsg, setPatientSuccessMsg] = useState('');
  const [patientErrorMsg, setPatientErrorMsg] = useState('');
  const [registeredPatientResult, setRegisteredPatientResult] = useState<any>(null);

  // Action status
  const [grantingStatus, setGrantingStatus] = useState<string>('');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, grantsData, actData, patsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getGrants(),
        adminService.getDoctorActivities(),
        patientService.listPatients().catch(() => []),
      ]);
      setUsers(usersData);
      setGrants(grantsData);
      setActivities(actData);
      setLivePatients(patsData || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDoctor(true);
    setDoctorSuccessMsg('');
    setDoctorErrorMsg('');
    try {
      const created = await adminService.createDoctor(newDoctor);
      setDoctorSuccessMsg(`Dr. ${created.full_name} (${created.email}) successfully registered in database!`);
      setNewDoctor({
        full_name: '',
        email: '',
        password: 'password123',
        department: 'Gastroenterology',
        license_number: 'MD-CL-2026',
        role: 'doctor',
      });
      await loadAllAdminData();
      setInspectedDoctorId(created.id);
      setActiveTab('inspect-doctor');
    } catch (err: any) {
      setDoctorErrorMsg(err.message || 'Failed to register doctor');
    } finally {
      setCreatingDoctor(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPatient(true);
    setPatientSuccessMsg('');
    setPatientErrorMsg('');
    setRegisteredPatientResult(null);
    try {
      const res = await adminService.createPatient(newPatient);
      setPatientSuccessMsg(res.message);
      setRegisteredPatientResult(res);
      setNewPatient({
        id: '',
        name: '',
        mrn: '',
        date_of_birth: '',
        gender: 'Female',
        conditions: '',
        allergies: '',
        assigned_doctor_ids: [],
        permissions: 'read,write,query,reconcile',
      });
      await loadAllAdminData();
    } catch (err: any) {
      setPatientErrorMsg(err.message || 'Failed to register patient');
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleAutoFillSamplePatient = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const activeDocIds = doctorsList.length > 0 ? [doctorsList[0].id] : [];
    setNewPatient({
      id: '',
      name: 'Sophia Charlotte Hayes',
      mrn: `MRN-${randomSuffix}`,
      date_of_birth: '1984-07-19',
      gender: 'Female',
      conditions: 'Hypertension, Gastroesophageal Reflux Disease, Asthma',
      allergies: 'Penicillin, Sulfa drugs',
      assigned_doctor_ids: activeDocIds,
      permissions: 'read,write,query,reconcile',
    });
  };

  const handleQuickGrant = async (userId: number, patientId: string) => {
    setGrantingStatus(`Granting ${patientId}...`);
    try {
      await adminService.createGrant({
        user_id: userId,
        patient_id: patientId,
        permissions: 'read,write,query,reconcile',
      });
      await loadAllAdminData();
      setGrantingStatus('');
    } catch (err: any) {
      alert(`Error granting access: ${err.message}`);
      setGrantingStatus('');
    }
  };

  const handleRevokeGrant = async (grantId: number, docName: string, patId: string) => {
    if (!confirm(`Revoke ${docName}'s access to patient ${patId}?`)) return;
    try {
      await adminService.revokeGrant(grantId);
      await loadAllAdminData();
    } catch (err: any) {
      alert(`Error revoking grant: ${err.message}`);
    }
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to permanently delete patient ${patientName} (${patientId}) from the hospital database?`)) {
      return;
    }
    try {
      const res = await adminService.deletePatient(patientId);
      alert(res.message || 'Patient deleted successfully.');
      await loadAllAdminData();
    } catch (err: any) {
      alert(`Failed to delete patient: ${err.message}`);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (selectedDoctorFilter !== 'all' && String(act.user_id) !== selectedDoctorFilter) {
      return false;
    }
    if (selectedActionFilter !== 'all' && !act.action.toLowerCase().includes(selectedActionFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        act.doctor_name.toLowerCase().includes(q) ||
        act.action.toLowerCase().includes(q) ||
        (act.patient_id && act.patient_id.toLowerCase().includes(q)) ||
        (act.patient_name && act.patient_name.toLowerCase().includes(q)) ||
        act.resource.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const doctorsList = users.filter((u) => u.role === 'doctor' || u.role === 'reviewer' || u.role === 'auditor');
  const inspectedDoctor = inspectedDoctorId ? users.find((u) => u.id === inspectedDoctorId) : null;

  // Merge live patients with fallback list
  const allHospitalPatients = livePatients.length > 0 ? livePatients.map((p) => {
    let condition = 'Clinical Intake Pending';
    if (p.metadata_json) {
      try {
        const meta = typeof p.metadata_json === 'string' ? JSON.parse(p.metadata_json) : p.metadata_json;
        const conds = meta.chronic_conditions || meta.conditions;
        if (conds && Array.isArray(conds) && conds.length > 0) {
          condition = conds.join(', ');
        }
      } catch {}
    }
    return {
      id: p.id,
      name: p.name,
      mrn: p.mrn,
      dob: p.date_of_birth,
      gender: p.gender,
      condition,
    };
  }) : [
    { id: 'P001', name: 'Eleanor Vance', mrn: 'MRN-849201', dob: '1978-04-12', gender: 'Female', condition: 'Gastroesophageal Reflux, Hypertension' },
    { id: 'P002', name: 'Marcus Aurelius Green', mrn: 'MRN-204912', dob: '1965-11-23', gender: 'Male', condition: 'Type 2 Diabetes' },
    { id: 'P999', name: 'Restricted Patient (VIP / Sealed)', mrn: 'MRN-999999', dob: '1990-01-01', gender: 'Female', condition: 'VIP / Sealed Profile Guard Test' }
  ];

  // Get assigned and unassigned patients for currently inspected doctor
  const inspectedDoctorGrants = inspectedDoctor ? inspectedDoctor.grants : [];
  const assignedPatientIds = new Set(inspectedDoctorGrants.map((g) => g.patient_id));
  
  const handlingPatientsList = allHospitalPatients.filter((p) => assignedPatientIds.has(p.id));
  const unassignedPatientsList = allHospitalPatients.filter((p) => !assignedPatientIds.has(p.id));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Top Admin Banner */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs border border-slate-200/80 bg-white rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-800 uppercase tracking-wider font-bold">
              Hospital Administrator Console
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-emerald-600" /> Doctor Governance & Patient Access Matrix
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Inspect individual doctor profiles, register new patients, assign authorizations, and track live clinical activities.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-2 shrink-0 cursor-pointer self-start md:self-auto font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-slate-500 font-bold flex items-center gap-1.5 text-xs">
            <Stethoscope className="w-4 h-4 text-emerald-600" /> Active Clinicians
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {doctorsList.length}
          </div>
          <div className="text-[11px] text-slate-500 font-sans font-medium">Sakthi, Varun, Rakshana...</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-slate-500 font-bold flex items-center gap-1.5 text-xs">
            <Key className="w-4 h-4 text-emerald-600" /> Active Patient Grants
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {grants.length}
          </div>
          <div className="text-[11px] text-slate-500 font-sans font-medium">Explicit authorizations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-slate-500 font-bold flex items-center gap-1.5 text-xs">
            <PatientIcon className="w-4 h-4 text-emerald-600" /> Hospital Patients
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {allHospitalPatients.length}
          </div>
          <div className="text-[11px] text-slate-500 font-sans font-medium">Registered in database</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-slate-500 font-bold flex items-center gap-1.5 text-xs">
            <Database className="w-4 h-4 text-emerald-600" /> Database Status
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Connected
          </div>
          <div className="text-[11px] text-slate-500 font-sans font-medium">Hospital SQL Database</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => {
            setActiveTab('inspect-doctor');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-heading transition-all cursor-pointer ${
            activeTab === 'inspect-doctor'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> 1. Clinician Directory & Profiles
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-heading transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> 2. Doctor Activity Feed ({activities.length})
        </button>

        <button
          onClick={() => setActiveTab('new-doctor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-heading transition-all cursor-pointer ${
            activeTab === 'new-doctor'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" /> 3. Register New Doctor
        </button>

        <button
          onClick={() => setActiveTab('new-patient')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-heading transition-all cursor-pointer ${
            activeTab === 'new-patient'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <PatientIcon className="w-4 h-4" /> 4. Register New Patient (Intake Desk)
        </button>
      </div>

      {/* TAB 1: INSPECT DOCTOR & MANAGE PATIENT ACCESS */}
      {activeTab === 'inspect-doctor' && (
        <div className="space-y-6 animate-fade-in">
          {/* VIEW 1: ALL DOCTORS DIRECTORY (WHEN NO DOCTOR SELECTED) */}
          {inspectedDoctorId === null || !inspectedDoctor ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                <div>
                  <h2 className="text-base font-bold font-heading text-emerald-950 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-emerald-700" /> Hospital Clinician & Auditor Directory
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Click any doctor or auditor card to open their dedicated page showing their profile and handling patients.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {doctorsList.length} Active Staff Members
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {doctorsList.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setInspectedDoctorId(doc.id)}
                    className="bg-white p-5 rounded-2xl cursor-pointer relative overflow-hidden flex flex-col justify-between group border-2 border-emerald-200/90 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-900 font-bold font-mono text-base group-hover:scale-105 transition-transform shadow-2xs">
                          {doc.full_name.charAt(0)}
                        </div>
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                          doc.role === 'auditor' 
                            ? 'bg-purple-100 text-purple-900 border-purple-300' 
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {doc.role}
                        </span>
                      </div>

                      <h3 className="font-bold text-base font-heading text-slate-950 group-hover:text-emerald-900 transition-colors">
                        {doc.full_name}
                      </h3>
                      <div className="text-xs font-semibold text-emerald-800 mt-0.5">{doc.department}</div>
                      <div className="text-[11px] font-mono text-slate-600 font-medium mt-1">{doc.email}</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-900 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                        {doc.grants.length} Patients
                      </span>
                      <span className="text-emerald-800 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform font-sans text-xs">
                        Open Profile <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW 2: DEDICATED DOCTOR / AUDITOR PROFILE PAGE */
            <div className="space-y-6 animate-fade-in">
              {/* Back Navigation Bar & Breadcrumbs */}
              <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-emerald-200">
                <button
                  onClick={() => setInspectedDoctorId(null)}
                  className="btn-secondary text-xs flex items-center gap-2 cursor-pointer font-bold text-slate-900 bg-white hover:bg-emerald-50 border border-emerald-300 shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-700" /> ← Back to Clinician Directory
                </button>

                <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-600">
                  <span>Directory</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-900 font-bold">{inspectedDoctor.full_name}</span>
                </div>
              </div>

              {/* Dedicated Profile Details Card */}
              <div className="glass-panel p-6 space-y-6 border-2 border-emerald-300 bg-white/95 shadow-sm">
                {/* Clinician Bio Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-emerald-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white font-bold font-mono text-2xl shadow-md shadow-emerald-900/20 shrink-0">
                      {inspectedDoctor.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold font-heading text-emerald-950">
                          {inspectedDoctor.full_name}
                        </h2>
                        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold border ${
                          inspectedDoctor.role === 'auditor'
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {inspectedDoctor.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-mono mt-1 flex items-center gap-2 flex-wrap font-medium">
                        <span>{inspectedDoctor.email}</span>
                        <span>•</span>
                        <span>License: <strong className="text-slate-950 font-bold">{inspectedDoctor.license_number}</strong></span>
                        <span>•</span>
                        <span>Dept: <strong className="text-slate-950 font-bold">{inspectedDoctor.department}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-300 shadow-2xs">
                      <span className="text-slate-700 font-medium">Assigned Patients: </span>
                      <strong className="text-emerald-950 text-sm font-bold">{inspectedDoctor.grants.length}</strong>
                    </div>

                    {onSwitchToDoctor && (
                      <button
                        onClick={() => onSwitchToDoctor(inspectedDoctor.email)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-2 cursor-pointer font-bold shadow-sm"
                      >
                        <span>View Doctor's Directory</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Handling Patients Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold font-heading text-emerald-950 flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-700" /> Handling Patients for {inspectedDoctor.full_name}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        These are the specific patient records currently authorized for {inspectedDoctor.full_name}.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                      {handlingPatientsList.length} Active Charts
                    </span>
                  </div>

                  {/* Handling Patients Grid */}
                  {handlingPatientsList.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-300 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 mx-auto flex items-center justify-center text-emerald-700">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-950">No Handling Patients Assigned</h4>
                      <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                        {inspectedDoctor.full_name} currently does not have access to any patient charts. You can grant access to hospital patients below.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {handlingPatientsList.map((patient) => {
                        const matchingGrant = inspectedDoctorGrants.find((g) => g.patient_id === patient.id);

                        return (
                          <div
                            key={patient.id}
                            className="bg-white p-4 rounded-2xl flex flex-col justify-between space-y-3 border-2 border-emerald-300 shadow-sm hover:border-emerald-500 hover:bg-emerald-50/30 transition-all"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border bg-emerald-100 text-emerald-950 border-emerald-300">
                                    {patient.id}
                                  </span>
                                  <span className="font-bold text-sm text-slate-950 font-heading">
                                    {patient.name}
                                  </span>
                                </div>

                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                                  <ShieldCheck className="w-3 h-3 text-emerald-700" /> Authorized
                                </span>
                              </div>

                              {/* High Contrast Patient Info Box */}
                              <div className="space-y-1.5 text-xs text-slate-900 font-mono bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                                <div className="text-xs text-slate-950 font-bold">MRN: {patient.mrn} • {patient.gender}</div>
                                <div className="text-xs text-slate-800 font-semibold truncate">Cond: {patient.condition}</div>
                                {matchingGrant && (
                                  <div className="text-xs text-emerald-950 font-bold pt-1.5 border-t border-emerald-200 flex items-center justify-between">
                                    <span>Scope: {matchingGrant.permissions}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                              {onOpenPatientWorkspace && (
                                <button
                                  onClick={() => onOpenPatientWorkspace(patient.id, inspectedDoctor.email)}
                                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Open Chart <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {matchingGrant && (
                                <button
                                  onClick={() => handleRevokeGrant(matchingGrant.grant_id, inspectedDoctor.full_name, patient.id)}
                                  className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 font-mono text-xs flex items-center justify-center transition-all cursor-pointer font-bold"
                                  title="Revoke Access"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Grant Access to Additional Hospital Patients */}
                {unassignedPatientsList.length > 0 && (
                  <div className="pt-5 border-t border-emerald-200 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold font-heading text-emerald-950 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-700" /> Grant Access to Additional Hospital Patients
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Authorize {inspectedDoctor.full_name} to access unassigned hospital patient charts.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unassignedPatientsList.map((patient) => (
                        <div
                          key={patient.id}
                          className="bg-white p-4 rounded-2xl flex flex-col justify-between space-y-3 border-2 border-slate-200 hover:border-emerald-400 transition-all shadow-xs"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border bg-rose-100 text-rose-950 border-rose-300">
                                  {patient.id}
                                </span>
                                <span className="font-bold text-sm text-slate-950 font-heading">
                                  {patient.name}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
                                <Lock className="w-3 h-3 text-rose-700" /> No Grant
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-slate-900 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <div className="text-xs text-slate-950 font-bold">MRN: {patient.mrn} • {patient.gender}</div>
                              <div className="text-xs text-slate-800 font-semibold truncate">Cond: {patient.condition}</div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200">
                            <button
                              onClick={() => handleQuickGrant(inspectedDoctor.id, patient.id)}
                              className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Grant Access to {patient.id}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCTOR ACTIVITY FEED */}
      {activeTab === 'activity' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls & Filters */}
          <div className="glass-panel p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs border-2 border-emerald-200 bg-white/95 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activity by doctor name, action, or patient ID..."
                className="input-field pl-9 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="input-field py-2 text-xs font-mono font-medium text-slate-900 bg-slate-50 border border-slate-300"
              >
                <option value="all">All Doctors & Staff</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>

              <select
                value={selectedActionFilter}
                onChange={(e) => setSelectedActionFilter(e.target.value)}
                className="input-field py-2 text-xs font-mono font-medium text-slate-900 bg-slate-50 border border-slate-300"
              >
                <option value="all">All Action Types</option>
                <option value="QUERY">Evidence AI Inquiries</option>
                <option value="LOGIN">Auth Logins</option>
                <option value="CONFLICT">Conflict Resolutions</option>
                <option value="ACCESS">Patient Access Checks</option>
                <option value="DENIED">Blocked 403 Attempts</option>
                <option value="UPLOAD">Document Uploads</option>
              </select>
            </div>
          </div>

          {/* Activity List */}
          {filteredActivities.length === 0 ? (
            <div className="glass-panel p-12 text-center text-xs text-slate-600 bg-white border-2 border-emerald-200">
              No doctor activities match the current filter.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredActivities.map((act) => {
                const isDenied = act.status === 'DENIED' || act.action.includes('DENIED') || act.action.includes('FAIL');
                const isQuery = act.action.includes('QUERY') || act.action.includes('QUESTION');
                const isGrant = act.action.includes('GRANT');

                return (
                  <div
                    key={act.id}
                    className={`p-4 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-white border-2 shadow-2xs hover:border-emerald-500 hover:bg-emerald-50/30 ${
                      isDenied
                        ? 'border-rose-300 bg-rose-50/40'
                        : isQuery
                        ? 'border-cyan-300 bg-cyan-50/30'
                        : isGrant
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-950 flex items-center gap-1.5 text-xs">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                          {act.doctor_name}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                          {act.doctor_role}
                        </span>
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border ${
                            isDenied
                              ? 'bg-rose-100 text-rose-950 border-rose-300'
                              : isQuery
                              ? 'bg-cyan-100 text-cyan-950 border-cyan-300'
                              : isGrant
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {act.action}
                        </span>
                        {act.patient_id && (
                          <span className="font-mono text-[11px] font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            Patient: {act.patient_name || act.patient_id} ({act.patient_id})
                          </span>
                        )}
                      </div>

                      <div className="text-slate-900 font-sans text-xs font-medium">
                        {act.details?.query && (
                          <span className="italic font-normal">
                            Asked: "{act.details.query}"
                          </span>
                        )}
                        {act.details?.conflict_type && (
                          <span>
                            Resolved conflict: <strong className="font-bold text-slate-950">{act.details.conflict_type}</strong> → Choice: <em className="font-semibold text-emerald-900">{act.details.chosen_resolution}</em>
                          </span>
                        )}
                        {act.details?.granted_to_email && (
                          <span>
                            Assigned patient grant to <strong className="font-bold text-slate-950">{act.details.granted_to_email}</strong> for <em className="font-semibold text-emerald-900">{act.details.patient_id}</em>
                          </span>
                        )}
                        {!act.details?.query && !act.details?.conflict_type && !act.details?.granted_to_email && (
                          <span className="text-slate-700 font-mono text-[11px]">
                            Resource: {act.resource}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between text-[11px] font-mono font-bold text-slate-700 shrink-0">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTER NEW DOCTOR (CREATE IN DB) */}
      {activeTab === 'new-doctor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Registration Form */}
          <div className="md:col-span-2 glass-panel p-6 space-y-4 border-2 border-emerald-300 bg-white/95 shadow-sm">
            <h3 className="text-base font-bold font-heading text-emerald-950 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-700" /> Register Clinician
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Creates an authentic record in the <code className="text-emerald-900 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">users</code> and <code className="text-emerald-900 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">staff_profiles</code> tables with encrypted credentials and role permissions.
            </p>

            {doctorSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 font-mono font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> {doctorSuccessMsg}
              </div>
            )}

            {doctorErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs flex items-center gap-2 font-mono font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" /> {doctorErrorMsg}
              </div>
            )}

            <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Doctor Full Name:</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.full_name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, full_name: e.target.value })}
                    placeholder="e.g. Dr. Priyanga, MD"
                    className="input-field py-2.5 text-xs w-full font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Hospital Email Address:</label>
                  <input
                    type="email"
                    required
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    placeholder="e.g. doctor.priyanga@carelens.ai"
                    className="input-field py-2.5 text-xs w-full font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Department / Specialty:</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.department}
                    onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                    placeholder="e.g. Gastroenterology, Cardiology, Oncology"
                    className="input-field py-2.5 text-xs w-full font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Medical License Number:</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.license_number}
                    onChange={(e) => setNewDoctor({ ...newDoctor, license_number: e.target.value })}
                    placeholder="e.g. MD-CL-94821"
                    className="input-field py-2.5 text-xs w-full font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Initial Password:</label>
                  <input
                    type="password"
                    required
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                    className="input-field py-2.5 text-xs w-full font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Assigned System Role:</label>
                  <select
                    value={newDoctor.role}
                    onChange={(e) => setNewDoctor({ ...newDoctor, role: e.target.value })}
                    className="input-field py-2.5 text-xs w-full font-mono font-bold text-slate-900"
                  >
                    <option value="doctor">Attending Doctor (Clinical Scope)</option>
                    <option value="reviewer">Peer Reviewer / Specialist</option>
                    <option value="auditor">Compliance Auditor (Read-Only)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creatingDoctor}
                  className="btn-primary py-3 text-xs w-full flex items-center justify-center gap-2 cursor-pointer font-bold shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  {creatingDoctor ? 'Registering Clinician in Database...' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>

          {/* Current Doctors List Sidebar */}
          <div className="glass-panel p-5 space-y-4 border-2 border-emerald-200 bg-white/95 shadow-xs">
            <h3 className="text-xs font-bold font-mono text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" /> Database Clinicians ({doctorsList.length})
            </h3>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {doctorsList.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setInspectedDoctorId(u.id);
                    setActiveTab('inspect-doctor');
                  }}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-1 text-xs shadow-2xs ${
                    inspectedDoctorId === u.id
                      ? 'bg-emerald-100/70 border-emerald-600'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-950">{u.full_name}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 font-medium">{u.email}</div>
                  <div className="text-[11px] text-slate-700 font-medium flex items-center justify-between pt-1 border-t border-slate-200">
                    <span>{u.department}</span>
                    <span className="text-emerald-900 font-mono font-bold">{u.grants.length} patients</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REGISTER NEW PATIENT (INTAKE DESK) */}
      {activeTab === 'new-patient' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Patient Intake Form */}
          <div className="md:col-span-2 glass-panel p-6 space-y-4 border-2 border-emerald-300 bg-white/95 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
              <div>
                <h3 className="text-base font-bold font-heading text-emerald-950 flex items-center gap-2">
                  <PatientIcon className="w-5 h-5 text-emerald-700" /> Patient Intake & Demographic Registration Desk
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Registers an authentic patient chart into the hospital database and assigns authorized primary attending clinicians.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutoFillSamplePatient}
                className="btn-secondary text-xs py-1.5 px-3 bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Auto-Fill Demo Intake
              </button>
            </div>

            {patientSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs space-y-2 font-mono shadow-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> {patientSuccessMsg}
                  </div>
                  {onOpenPatientWorkspace && registeredPatientResult?.patient?.id && (
                    <button
                      type="button"
                      onClick={() => onOpenPatientWorkspace(registeredPatientResult.patient.id)}
                      className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-xs bg-emerald-800 text-white hover:bg-emerald-900"
                    >
                      <span>Open Patient Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {registeredPatientResult?.assigned_grants && (
                  <div className="text-xs text-slate-800 font-sans font-medium pl-7">
                    Granted access to {registeredPatientResult.assigned_grants.length} doctor(s):{' '}
                    <strong className="text-emerald-950 font-bold">{registeredPatientResult.assigned_grants.map((g: any) => g.doctor_name).join(', ')}</strong>
                  </div>
                )}
              </div>
            )}

            {patientErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs flex items-center gap-2 font-mono font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" /> {patientErrorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              {/* Row 1: Name & Patient ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-900 font-bold mb-1.5">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="e.g. Sophia Charlotte Hayes"
                    className="input-field py-2.5 text-xs w-full font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">
                    Patient ID <span className="text-slate-500 font-normal">(Auto if blank)</span>
                  </label>
                  <input
                    type="text"
                    value={newPatient.id || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, id: e.target.value })}
                    placeholder="e.g. P003"
                    className="input-field py-2.5 text-xs w-full font-mono font-bold text-emerald-950 uppercase"
                  />
                </div>
              </div>

              {/* Row 2: MRN, DOB, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Medical Record # (MRN) *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.mrn}
                    onChange={(e) => setNewPatient({ ...newPatient, mrn: e.target.value })}
                    placeholder="e.g. MRN-583921"
                    className="input-field py-2.5 text-xs w-full font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                    className="input-field py-2 text-xs w-full font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">Biological Gender *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="input-field py-2.5 text-xs w-full font-bold text-slate-900"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Conditions & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">
                    Primary Conditions / Diagnoses <span className="text-slate-500 font-normal">(Comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={newPatient.conditions || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, conditions: e.target.value })}
                    placeholder="e.g. Hypertension, Gastroesophageal Reflux, Asthma"
                    className="input-field py-2.5 text-xs w-full font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 font-bold mb-1.5">
                    Known Allergies <span className="text-slate-500 font-normal">(Comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={newPatient.allergies || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Sulfa, Latex"
                    className="input-field py-2.5 text-xs w-full font-medium"
                  />
                </div>
              </div>

              {/* Row 4: Attending Clinician Assignment */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-950 font-bold flex items-center gap-1.5 text-xs">
                    <Stethoscope className="w-4 h-4 text-emerald-700" /> Assign Attending Doctors / Clinicians:
                  </label>
                  <span className="text-[11px] font-mono text-emerald-900 font-bold">
                    {newPatient.assigned_doctor_ids.length} Doctor(s) Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {doctorsList.map((doc) => {
                    const isSelected = newPatient.assigned_doctor_ids.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          const updated = isSelected
                            ? newPatient.assigned_doctor_ids.filter((id) => id !== doc.id)
                            : [...newPatient.assigned_doctor_ids, doc.id];
                          setNewPatient({ ...newPatient, assigned_doctor_ids: updated });
                        }}
                        className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-100 border-emerald-600 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-950">{doc.full_name}</div>
                          <div className="text-[10px] font-mono text-slate-600">{doc.department} • {doc.license_number}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center font-bold ${
                          isSelected ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creatingPatient}
                  className="btn-primary py-3 text-xs w-full flex items-center justify-center gap-2 cursor-pointer font-bold shadow-md"
                >
                  <PatientIcon className="w-4 h-4" />
                  {creatingPatient ? 'Registering Patient & Generating Grants...' : 'Complete Patient Intake & Register Patient'}
                </button>
              </div>
            </form>
          </div>

          {/* Hospital Patients Master Registry Sidebar */}
          <div className="glass-panel p-5 space-y-4 border-2 border-emerald-200 bg-white/95 shadow-xs">
            <h3 className="text-xs font-bold font-mono text-emerald-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" /> Database Registry ({allHospitalPatients.length})
              </span>
              <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">Live DB</span>
            </h3>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {allHospitalPatients.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border-2 bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all space-y-1.5 shadow-2xs text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-950 font-heading">{p.name}</span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                      {p.id}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-700 font-medium">
                    MRN: {p.mrn} • {p.gender} • DOB: {p.dob}
                  </div>
                  <div className="text-[11px] text-slate-800 font-medium truncate pt-1 border-t border-slate-100">
                    {p.condition}
                  </div>
                  <div className="pt-1 flex items-center gap-1.5">
                    {onOpenPatientWorkspace && (
                      <button
                        onClick={() => onOpenPatientWorkspace(p.id)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-mono font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3 h-3" /> View Chart
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePatient(p.id, p.name)}
                      title="Permanently delete patient record"
                      className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
