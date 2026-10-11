import React, { useState, useEffect } from 'react';
import { Appointment } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { QueueTokenCard } from '../components/QueueTokenCard.tsx';
import { EmailVerificationModal } from '../components/EmailVerificationModal.tsx';
import {
  Calendar,
  Clock,
  Ticket,
  HeartHandshake,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  Tag,
  Loader2,
  User as UserIcon,
  Edit3,
  LogOut,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
  onOpenFinancialAid: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onNavigate,
  onOpenFinancialAid,
}) => {
  const { user, logout, refreshUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyAppointments();
      setAppointments(res.appointments);
    } catch (err) {
      console.error('Error loading patient appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (apt: Appointment) => {
    if (!window.confirm(`Are you sure you want to cancel your appointment with ${apt.doctorName} (Token: ${apt.queueToken})? This will release your reserved slot back to available.`)) {
      return;
    }

    setCancellingId(apt.id);
    setCancelMessage(null);
    try {
      const res = await api.cancelAppointment(apt.id);
      setCancelMessage(`Appointment cancelled successfully. Slot for ${apt.timeSlot} on ${apt.date} has been released back to Available (Green).`);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  const activeAppointments = appointments.filter(
    (a) => a.status === 'waiting' || a.status === 'in_consultation'
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-sky-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-300 shadow-md shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                Patient Portal
              </span>
              {user?.financialAssistanceApproved && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {user.approvedDiscountPercent}% Subsidy Active
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.name}
            </h1>
            <div className="text-xs text-teal-100 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{user?.email}</span>
              {user?.isEmailVerified ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold">
                  Verified ✓
                </span>
              ) : (
                <button
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="text-[10px] bg-amber-400 text-slate-950 hover:bg-amber-300 px-2 py-0.2 rounded-full font-bold cursor-pointer transition-colors"
                >
                  Unverified ⚠ – Verify Now
                </button>
              )}
              {user?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{user.phone}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('directory')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={loadAppointments}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Refresh queue status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unverified Email Alert Banner */}
      {user && !user.isEmailVerified && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-amber-950">
                Email Verification Required
              </h3>
              <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                Your email (<strong className="font-mono text-amber-950">{user.email}</strong>) is not yet verified. Please verify your email to unlock appointment bookings with verified doctors.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVerifyModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Verify Email Now
          </button>
        </div>
      )}

      {/* Required Patient Dashboard Quick-Action Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onNavigate('profile', { tab: 'profile' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-teal-600" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => onNavigate('profile', { tab: 'profile', edit: true })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-teal-600" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => onNavigate('directory')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Book Appointment</span>
            </button>

            <a
              href="#active-appointments"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>My Appointments</span>
            </a>

            <a
              href="#active-appointments"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50 transition-colors"
            >
              <Ticket className="w-4 h-4 text-teal-600" />
              <span>My Queue Token</span>
            </a>

            <button
              onClick={() => onNavigate('affordable-care')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50 transition-colors"
            >
              <HeartHandshake className="w-4 h-4 text-teal-600" />
              <span>Affordable Healthcare</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
                onNavigate('home');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Cancellation Success Feedback */}
      {cancelMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelMessage}</span>
          </div>
          <button
            onClick={() => setCancelMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Patient Profile Snapshot Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              Verified Patient ID: {user?.id}
            </span>
          </div>
          <div className="text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Gender: <strong>{user?.gender || 'Not specified'}</strong></span>
            <span>Date of Birth: <strong>{user?.dateOfBirth || 'Not specified'}</strong></span>
            {user?.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {user.address}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile', { tab: 'profile', edit: true })}
          className="px-4 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors shrink-0 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Profile Details</span>
        </button>
      </div>

      {/* Section 1: Active Queue Tokens (Waiting or In Consultation) */}
      <div id="active-appointments" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Active Queue Tokens & Bookings ({activeAppointments.length})
            </h2>
            <p className="text-xs text-slate-500">
              Live estimated wait times and patient queue sequence
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Retrieving patient queue tokens from database...</p>
          </div>
        ) : activeAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <Ticket className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No active queue tokens right now</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any active appointments. Choose a doctor from our 18 specialties to book an available green slot.
            </p>
            <button
              onClick={() => onNavigate('directory')}
              className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAppointments.map((apt) => (
              <QueueTokenCard
                key={apt.id}
                appointment={apt}
                onCancel={handleCancel}
                isCancelling={cancellingId === apt.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Previous Appointments History */}
      {pastAppointments.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Appointment History ({pastAppointments.length})
            </h2>
            <p className="text-xs text-slate-500">Completed visits & released slots</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastAppointments.map((apt) => (
              <QueueTokenCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        email={user?.email || ''}
        mode="registration"
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
