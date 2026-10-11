import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, AppointmentStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SlotLegend } from '../components/SlotLegend.tsx';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle,
  PlayCircle,
  XCircle,
  RefreshCw,
  Edit,
  DollarSign,
  User,
  ShieldCheck,
  Tag,
  Loader2,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const doctorId = user?.doctorId || 'doc_1';
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Edit fee/profile state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [feeInput, setFeeInput] = useState(250);
  const [discountedFeeInput, setDiscountedFeeInput] = useState<number | ''>('');
  const [offersFree, setOffersFree] = useState(false);
  const [durationInput, setDurationInput] = useState(15);
  const [bioInput, setBioInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  const loadDoctorData = async () => {
    setIsLoading(true);
    try {
      const [aptRes, docRes] = await Promise.all([
        api.getDoctorAppointments(doctorId, selectedDate),
        api.getDoctorById(doctorId),
      ]);
      setAppointments(aptRes.appointments);
      if (docRes.doctor) {
        setDoctorProfile(docRes.doctor);
        setFeeInput(docRes.doctor.consultationFee);
        setDiscountedFeeInput(docRes.doctor.discountedFee ?? '');
        setOffersFree(docRes.doctor.offersFreeConsultation);
        setDurationInput(docRes.doctor.consultationDurationMinutes);
        setBioInput(docRes.doctor.bio || '');
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [doctorId, selectedDate]);

  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setIsUpdatingStatus(appointmentId);
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      loadDoctorData();
    } catch (err: any) {
      alert(err.message || 'Failed to update queue status.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsFeedback(null);
    try {
      await api.updateDoctorProfile(doctorId, {
        consultationFee: Number(feeInput),
        discountedFee: discountedFeeInput === '' ? undefined : Number(discountedFeeInput),
        offersFreeConsultation: offersFree,
        consultationDurationMinutes: Number(durationInput),
        bio: bioInput,
      });
      setSettingsFeedback('Professional settings and consultation fees saved successfully!');
      setIsEditingSettings(false);
      loadDoctorData();
    } catch (err: any) {
      setSettingsFeedback(err.message || 'Failed to update settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const waitingCount = appointments.filter((a) => a.status === 'waiting').length;
  const inConsultation = appointments.find((a) => a.status === 'in_consultation');
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={doctorProfile?.avatar || user?.avatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80'}
            alt="Doctor"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-400/40 shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase tracking-wider border border-sky-400/30">
                Doctor Console
              </span>
              <span className="text-xs text-teal-400 font-semibold">
                {doctorProfile?.specialty || 'Specialist'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {doctorProfile?.name || user?.name}
            </h1>
            <p className="text-xs text-slate-400">
              {doctorProfile?.hospitalAffiliation} · {doctorProfile?.qualifications}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>{isEditingSettings ? 'Close Settings' : 'Manage Fees & Timings'}</span>
          </button>
          <button
            onClick={loadDoctorData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {settingsFeedback && (
        <div className="bg-teal-50 border border-teal-200 text-teal-900 text-xs p-4 rounded-2xl flex items-center justify-between">
          <span>{settingsFeedback}</span>
          <button onClick={() => setSettingsFeedback(null)} className="text-xs font-bold text-teal-700">Dismiss</button>
        </div>
      )}

      {/* Settings Form Modal/Accordion */}
      {isEditingSettings && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Manage Consultation Fees & Duration</h3>
            <p className="text-xs text-slate-500">Configure appointment pricing and consultation queue parameters</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Standard Consultation Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={feeInput}
                onChange={(e) => setFeeInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Subsidized / Discounted Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Optional discounted rate"
                value={discountedFeeInput}
                onChange={(e) => setDiscountedFeeInput(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Avg Consultation Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={durationInput}
                onChange={(e) => setDurationInput(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center sm:pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={offersFree}
                  onChange={(e) => setOffersFree(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 border-slate-300"
                />
                <span>Offer Community Free Slots (₹0)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Doctor Bio / Clinical Focus
            </label>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingSettings(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              {isSavingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Queue Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Currently In Consultation</span>
            <div className="text-xl font-extrabold text-amber-600 mt-1 font-mono">
              {inConsultation ? inConsultation.queueToken : 'None'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {inConsultation ? inConsultation.patientName : 'No active patient right now'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <PlayCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Waiting in Queue</span>
            <div className="text-xl font-extrabold text-sky-600 mt-1 font-mono">
              {waitingCount} Patients
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Est. Queue Duration: ~{waitingCount * (doctorProfile?.consultationDurationMinutes || 15)} mins
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Consultations Completed</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">
              {completedCount} Today
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Checked out of clinic</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Date Filter & Slots Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-600" />
            Filter by Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <SlotLegend compact={true} />
      </div>

      {/* Today's Queue List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Patient Queue Schedule ({appointments.length})
            </h2>
            <p className="text-xs text-slate-500">
              Manage patient arrival order, start consultations, and mark appointments as completed.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading patient schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No scheduled appointments for {selectedDate}</p>
            <p className="text-xs text-slate-400">All appointment slots for this date are currently Available (Green).</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Queue Token</th>
                  <th className="py-3 px-4">Slot Time</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Queue Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {apt.queueToken}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {apt.timeSlot}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {apt.patientName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {apt.patientPhone || apt.patientEmail}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {apt.notes || 'Routine checkup'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {apt.finalFee === 0 ? <span className="text-emerald-700">FREE</span> : `₹${apt.finalFee}`}
                    </td>
                    <td className="py-3.5 px-4">
                      {apt.status === 'in_consultation' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          In Consultation
                        </span>
                      )}
                      {apt.status === 'waiting' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          Waiting (# {apt.queueNumber})
                        </span>
                      )}
                      {apt.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Completed
                        </span>
                      )}
                      {apt.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {apt.status === 'waiting' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'in_consultation')}
                          disabled={isUpdatingStatus === apt.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                        >
                          Call Patient
                        </button>
                      )}
                      {apt.status === 'in_consultation' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'completed')}
                          disabled={isUpdatingStatus === apt.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}
                      {apt.status === 'completed' && (
                        <span className="text-[11px] text-slate-400 font-medium">Finished</span>
                      )}
                      {apt.status === 'cancelled' && (
                        <span className="text-[11px] text-rose-500 font-medium">Slot Released</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
