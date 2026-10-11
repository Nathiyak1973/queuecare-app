import React, { useState, useEffect } from 'react';
import {
  AdminStats,
  Doctor,
  FinancialAssistanceRequest,
  Appointment,
  User,
  AuditLog,
  SpecialtyName,
} from '../types/index.ts';
import { api } from '../services/api.ts';
import { SPECIALTIES } from '../data/specialties.ts';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  Calendar,
  HeartHandshake,
  CheckCircle,
  XCircle,
  PlusCircle,
  Search,
  DollarSign,
  Activity,
  History,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'assistance' | 'appointments' | 'users' | 'audit'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [financialRequests, setFinancialRequests] = useState<FinancialAssistanceRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Doctor Form Modal State
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState<SpecialtyName>('General Physician');
  const [newDoctorQualifications, setNewDoctorQualifications] = useState('MBBS, MD');
  const [newDoctorExperience, setNewDoctorExperience] = useState(8);
  const [newDoctorHospital, setNewDoctorHospital] = useState('QueueCare Community Hospital');
  const [newDoctorFee, setNewDoctorFee] = useState(250);
  const [newDoctorDiscountFee, setNewDoctorDiscountFee] = useState<number | ''>(180);
  const [newDoctorOffersFree, setNewDoctorOffersFree] = useState(false);
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

  // Financial review modal
  const [reviewingRequest, setReviewingRequest] = useState<FinancialAssistanceRequest | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(50);
  const [adminRemarks, setAdminRemarks] = useState<string>('Approved subsidy based on economic criteria.');
  const [isReviewing, setIsReviewing] = useState(false);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, docRes, faRes, aptRes, userRes, logsRes] = await Promise.all([
        api.getAdminStats(),
        api.getDoctors({ includeUnverified: true }),
        api.getAdminFinancialRequests(),
        api.getAllAppointments(),
        api.getAllUsers(),
        api.getAuditLogs(),
      ]);
      setStats(statsRes.stats);
      setDoctors(docRes.doctors);
      setFinancialRequests(faRes.requests);
      setAppointments(aptRes.appointments);
      setUsers(userRes.users);
      setAuditLogs(logsRes.logs);
    } catch (err) {
      console.error('Error loading admin console:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleRegisterDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newDoctorEmail) return;

    setIsSubmittingDoctor(true);
    try {
      await api.createDoctor({
        name: newDoctorName,
        email: newDoctorEmail,
        phone: newDoctorPhone,
        specialty: newDoctorSpecialty,
        qualifications: newDoctorQualifications,
        experienceYears: Number(newDoctorExperience),
        hospitalAffiliation: newDoctorHospital,
        consultationFee: Number(newDoctorFee),
        discountedFee: newDoctorDiscountFee === '' ? undefined : Number(newDoctorDiscountFee),
        offersFreeConsultation: newDoctorOffersFree,
      });
      setIsAddingDoctor(false);
      // Reset form
      setNewDoctorName('');
      setNewDoctorEmail('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to register doctor.');
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  const handleToggleDoctorStatus = async (doc: Doctor, field: 'isVerified' | 'isActive') => {
    try {
      await api.toggleDoctorVerification(doc.id, {
        [field]: !doc[field],
      });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update doctor status.');
    }
  };

  const handleReviewAssistance = async (status: 'approved' | 'rejected') => {
    if (!reviewingRequest) return;
    setIsReviewing(true);
    try {
      await api.reviewFinancialRequest(reviewingRequest.id, {
        status,
        grantedDiscountPercent: status === 'approved' ? Number(discountPercent) : 0,
        adminRemarks,
      });
      setReviewingRequest(null);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to review request.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleToggleUserStatus = async (userItem: User) => {
    try {
      await api.toggleUserStatus(userItem.id, !userItem.isActive);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
              System Administration
            </span>
            <span className="text-xs text-slate-400 font-semibold">QueueCare Health Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Executive Admin Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Manage medical specialties, doctor credentials, consultation pricing, financial aid approvals, and user accounts.
          </p>
        </div>

        <button
          onClick={() => setIsAddingDoctor(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-2 shadow-sm transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Doctor</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px scrollbar-none">
        {[
          { id: 'overview', label: 'Metrics & Specialties', icon: Activity },
          { id: 'doctors', label: `Doctors (${doctors.length})`, icon: Stethoscope },
          { id: 'assistance', label: `Financial Aid (${financialRequests.length})`, icon: HeartHandshake },
          { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
          { id: 'users', label: `User Accounts (${users.length})`, icon: Users },
          { id: 'audit', label: 'Audit History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading system metrics and database records...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Patients</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalPatients}</div>
                  <span className="text-[10px] text-teal-600 font-medium">Registered accounts</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Doctors</span>
                  <div className="text-2xl font-extrabold text-teal-700 mt-1">{stats?.activeDoctors}</div>
                  <span className="text-[10px] text-slate-500 font-medium">{stats?.totalDoctors} registered</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Appointments</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalAppointments}</div>
                  <span className="text-[10px] text-sky-600 font-medium">{stats?.waitingAppointments} in queue</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed</span>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">{stats?.completedAppointments}</div>
                  <span className="text-[10px] text-slate-500 font-medium">Finished visits</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cancelled</span>
                  <div className="text-2xl font-extrabold text-rose-700 mt-1">{stats?.cancelledAppointments}</div>
                  <span className="text-[10px] text-slate-500 font-medium">Slots released</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Financial Aid</span>
                  <div className="text-2xl font-extrabold text-amber-700 mt-1">{stats?.approvedAssistanceRequests}</div>
                  <span className="text-[10px] text-slate-500 font-medium">{stats?.totalAssistanceRequests} applications</span>
                </div>
              </div>

              {/* Doctors Grouped by All 18 Specialties */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Doctors Grouped by All 18 Specialties
                    </h3>
                    <p className="text-xs text-slate-500">Distribution of credentialed healthcare staff</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {stats?.specialtyBreakdown.map((item) => (
                    <div
                      key={item.specialty}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between"
                    >
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{item.specialty}</span>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Available:</span>
                        <span className="font-extrabold text-teal-700">{item.count} docs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCTORS MANAGEMENT */}
          {activeTab === 'doctors' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registered Doctor Accounts</h3>
                  <p className="text-xs text-slate-500">Approve credentials, configure fees, and toggle active directory availability</p>
                </div>
                <button
                  onClick={() => setIsAddingDoctor(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Doctor</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Specialty</th>
                      <th className="py-3 px-4">Experience & Hospital</th>
                      <th className="py-3 px-4">Standard Fee</th>
                      <th className="py-3 px-4">Discount Fee</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Active</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img src={doc.avatar} alt={doc.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                            <div>
                              <div className="font-bold text-slate-900">{doc.name}</div>
                              <div className="text-[11px] text-slate-400">{doc.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-teal-800">{doc.specialty}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{doc.experienceYears} yrs · {doc.qualifications}</div>
                          <div className="text-slate-400 text-[11px]">{doc.hospitalAffiliation}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">₹{doc.consultationFee}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {doc.discountedFee ? `₹${doc.discountedFee}` : 'None'}
                          {doc.offersFreeConsultation && (
                            <span className="block text-[10px] font-bold text-emerald-700">Free Slots Enabled</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleDoctorStatus(doc, 'isVerified')}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              doc.isVerified
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {doc.isVerified ? 'Verified' : 'Pending Verification'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleDoctorStatus(doc, 'isActive')}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              doc.isActive
                                ? 'bg-teal-50 text-teal-800 border-teal-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {doc.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleDoctorStatus(doc, 'isVerified')}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL ASSISTANCE REQUESTS */}
          {activeTab === 'assistance' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Patient Financial Assistance Applications ({financialRequests.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Review income brackets and reasons to approve concession percentages (applied automatically at slot booking)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Income Bracket</th>
                      <th className="py-3 px-4">Requested Specialty</th>
                      <th className="py-3 px-4">Clinical / Hardship Reason</th>
                      <th className="py-3 px-4">Status & Subsidy</th>
                      <th className="py-3 px-4">Admin Remarks</th>
                      <th className="py-3 px-4 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financialRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{req.patientName}</div>
                          <div className="text-[11px] text-slate-400">{req.patientEmail} · {req.patientPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{req.annualIncomeRange}</td>
                        <td className="py-3.5 px-4 font-semibold text-teal-800">{req.requestedSpecialty}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">{req.reason}</td>
                        <td className="py-3.5 px-4">
                          {req.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Approved ({req.grantedDiscountPercent}% Off)
                            </span>
                          )}
                          {req.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Pending Review
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                          {req.adminRemarks || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setReviewingRequest(req);
                              setDiscountPercent(req.grantedDiscountPercent || 50);
                              setAdminRemarks(req.adminRemarks || 'Approved healthcare subsidy.');
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: APPOINTMENTS & QUEUE OVERVIEW */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Master Appointment Schedule & Queue Tokens
                </h3>
                <p className="text-xs text-slate-500">Live tokens, consulting doctor, and queue progression</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Token</th>
                      <th className="py-3 px-4">Doctor & Specialty</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4">Final Fee</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{apt.queueToken}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{apt.doctorName}</div>
                          <div className="text-[11px] text-teal-700">{apt.specialty}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{apt.patientName}</div>
                          <div className="text-[11px] text-slate-400">{apt.patientPhone || apt.patientEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {apt.date} · {apt.timeSlot}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {apt.finalFee === 0 ? <span className="text-emerald-700">FREE</span> : `₹${apt.finalFee}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            apt.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'waiting'
                              ? 'bg-sky-100 text-sky-800'
                              : apt.status === 'in_consultation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: USERS & ACCOUNTS */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">System User Accounts ({users.length})</h3>
                <p className="text-xs text-slate-500">Patients, doctors, and system administrators</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Phone / Address</th>
                      <th className="py-3 px-4">Financial Concession</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'doctor'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{u.phone || 'No phone'}</div>
                          <div className="text-slate-400 text-[11px] truncate max-w-xs">{u.address || '—'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.financialAssistanceApproved ? (
                            <span className="font-bold text-emerald-700">{u.approvedDiscountPercent}% Concession</span>
                          ) : (
                            <span className="text-slate-400">Standard</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`text-xs font-bold ${
                                u.isActive ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT HISTORY */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Administrative Audit Trail</h3>
                <p className="text-xs text-slate-500">Security history and administrative state transitions</p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/60 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-800">{log.performedBy} ({log.performedByRole})</span>
                      </div>
                      <p className="text-slate-600 text-xs">{log.details}</p>
                      <p className="text-slate-400 text-[11px]">Target: {log.target}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Register New Doctor Modal */}
      {isAddingDoctor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Register & Assign Doctor</h3>
                <p className="text-xs text-slate-400">Add medical specialist to QueueCare directory</p>
              </div>
              <button onClick={() => setIsAddingDoctor(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterDoctor} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Doctor Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Khanna"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Doctor Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh.khanna@queuecare.org"
                    value={newDoctorEmail}
                    onChange={(e) => setNewDoctorEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medical Specialty</label>
                  <select
                    value={newDoctorSpecialty}
                    onChange={(e) => setNewDoctorSpecialty(e.target.value as SpecialtyName)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-teal-500"
                  >
                    {SPECIALTIES.map((spec) => (
                      <option key={spec.name} value={spec.name}>{spec.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Qualifications</label>
                  <input
                    type="text"
                    required
                    value={newDoctorQualifications}
                    onChange={(e) => setNewDoctorQualifications(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    value={newDoctorExperience}
                    onChange={(e) => setNewDoctorExperience(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hospital Affiliation</label>
                  <input
                    type="text"
                    required
                    value={newDoctorHospital}
                    onChange={(e) => setNewDoctorHospital(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newDoctorFee}
                    onChange={(e) => setNewDoctorFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discounted Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional subsidized fee"
                    value={newDoctorDiscountFee}
                    onChange={(e) => setNewDoctorDiscountFee(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="offersFree"
                  checked={newDoctorOffersFree}
                  onChange={(e) => setNewDoctorOffersFree(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600"
                />
                <label htmlFor="offersFree" className="font-semibold text-slate-700 cursor-pointer">
                  Enable Free Consultation Slots (₹0) for Community Assistance
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingDoctor(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                >
                  {isSubmittingDoctor ? 'Creating...' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Financial Assistance Request Modal */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Review Financial Assistance Application</h3>
                <p className="text-xs text-slate-400">{reviewingRequest.patientName}</p>
              </div>
              <button onClick={() => setReviewingRequest(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div><strong className="text-slate-700">Income Bracket:</strong> {reviewingRequest.annualIncomeRange}</div>
                <div><strong className="text-slate-700">Requested Specialty:</strong> {reviewingRequest.requestedSpecialty}</div>
                <div><strong className="text-slate-700">Reason:</strong> {reviewingRequest.reason}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Granted Concession / Subsidy Percentage
                </label>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-teal-500 font-semibold"
                >
                  <option value={25}>25% Concession</option>
                  <option value={50}>50% Concession (Standard Assistance)</option>
                  <option value={75}>75% Concession (High Hardship)</option>
                  <option value={100}>100% Full Waiver (Free Healthcare ₹0)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Remarks</label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleReviewAssistance('rejected')}
                  disabled={isReviewing}
                  className="px-4 py-2 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewAssistance('approved')}
                  disabled={isReviewing}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs"
                >
                  {isReviewing ? 'Saving...' : `Approve ${discountPercent}% Discount`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
