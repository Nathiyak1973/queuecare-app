import React, { useState, useEffect } from 'react';
import { Doctor, Appointment, AppointmentSlot } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SlotLegend } from './SlotLegend.tsx';
import { EmailVerificationModal } from './EmailVerificationModal.tsx';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Tag,
  Loader2,
  Mail,
} from 'lucide-react';

interface AppointmentModalProps {
  doctor: Doctor;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  onViewExistingAppointment?: (appointment: Appointment) => void;
  onRequireLogin: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  doctor,
  onClose,
  onSuccess,
  onViewExistingAppointment,
  onRequireLogin,
}) => {
  const { user, refreshUser } = useAuth();

  // Date selection: default today, next 14 days
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [existingAppointment, setExistingAppointment] = useState<Appointment | null>(null);
  const [hasActiveAppointment, setHasActiveAppointment] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<Appointment | null>(null);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState<boolean>(false);

  // Generate date options for the next 14 days
  const dateOptions = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dateStr, dayName, monthDay };
  });

  // Fetch slots for doctor and date
  const loadSlots = async (date: string) => {
    setIsLoadingSlots(true);
    setErrorMessage(null);
    setSelectedSlot(null);
    try {
      const res = await api.getDoctorSlots(doctor.id, date);
      setSlots(res.slots);
      setHasActiveAppointment(res.hasActiveAppointment);
      setExistingAppointment(res.existingAppointment);
    } catch (err: any) {
      console.error('Failed to load slots:', err);
      setErrorMessage(err.message || 'Unable to retrieve slot schedule.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlots(selectedDate);
  }, [doctor.id, selectedDate]);

  // Fee calculation
  const originalFee = doctor.consultationFee;
  let finalFee = doctor.discountedFee !== undefined ? doctor.discountedFee : originalFee;
  let discountNote = doctor.discountedFee !== undefined ? 'Subsidized Clinic Rate' : '';

  if (user?.financialAssistanceApproved && user.approvedDiscountPercent) {
    const concession = Math.round((originalFee * user.approvedDiscountPercent) / 100);
    const assistedPrice = Math.max(0, originalFee - concession);
    if (assistedPrice < finalFee) {
      finalFee = assistedPrice;
      discountNote = `Approved Financial Assistance (${user.approvedDiscountPercent}% off)`;
    }
  }

  if (doctor.offersFreeConsultation && originalFee === 0) {
    finalFee = 0;
    discountNote = 'Free Healthcare Initiative';
  }

  const handleBooking = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    if (!user.isEmailVerified) {
      setShowEmailVerifyModal(true);
      return;
    }

    if (!selectedSlot) {
      setErrorMessage('Please select an available green slot to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.bookAppointment({
        doctorId: doctor.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes,
      });

      setBookingConfirmed(res.appointment);
      onSuccess(res.appointment);
    } catch (err: any) {
      console.error('Booking failed:', err);
      if (err.conflictType === 'EXISTING_APPOINTMENT_SAME_DOCTOR_DATE' && err.existingAppointment) {
        setHasActiveAppointment(true);
        setExistingAppointment(err.existingAppointment);
        setErrorMessage(
          err.message ||
            `You already have an appointment with this doctor on ${selectedDate} (Token: ${err.existingAppointment.queueToken}). Please view your existing appointment or choose another available slot.`
        );
      } else {
        setErrorMessage(err.message || 'Failed to complete booking. Please try another slot.');
      }
      // Reload slots to show updated real-time status
      loadSlots(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-400/40 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{doctor.name}</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {doctor.specialty}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{doctor.hospitalAffiliation}</p>
              <p className="text-xs text-teal-300 font-medium mt-0.5">
                Standard Consultation: {doctor.consultationDurationMinutes} mins / slot
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Confirmed State View */}
          {bookingConfirmed ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Appointment Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your appointment slot is reserved and your queue token has been generated.
                </p>
              </div>

              {/* Queue Token Badge */}
              <div className="max-w-xs mx-auto bg-gradient-to-br from-teal-50 to-sky-50 border-2 border-teal-300 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 block">
                  Official Queue Token
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono block my-1">
                  {bookingConfirmed.queueToken}
                </span>
                <div className="text-xs text-slate-600 font-medium">
                  Queue Position #{bookingConfirmed.queueNumber} · Est. Wait ~{bookingConfirmed.estimatedWaitMinutes} mins
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-semibold text-slate-800">{bookingConfirmed.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-semibold text-slate-800">{bookingConfirmed.date} at {bookingConfirmed.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payable Fee:</span>
                  <span className="font-bold text-emerald-700">₹{bookingConfirmed.finalFee}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
                >
                  Done & Back to Directory
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Unverified Email Alert */}
              {user && !user.isEmailVerified && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">
                        Email Verification Required to Book
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Please verify your email address (<strong className="font-mono">{user.email}</strong>) to activate appointment bookings.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmailVerifyModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    Verify Email Now
                  </button>
                </div>
              )}

              {/* Existing Active Appointment Alert (Duplicate prevention requirement) */}
              {hasActiveAppointment && existingAppointment && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900">
                        Existing Appointment Detected
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        You already have an active appointment with this doctor on {selectedDate} (Token: <strong className="font-mono">{existingAppointment.queueToken}</strong> at {existingAppointment.timeSlot}).
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Please view your existing appointment or choose another available slot/date.
                      </p>
                    </div>
                  </div>

                  {onViewExistingAppointment && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onViewExistingAppointment(existingAppointment)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>View Existing Appointment</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && !hasActiveAppointment && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Date Selection Horizon */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-teal-600" />
                  1. Select Consultation Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {dateOptions.map(({ dateStr, dayName, monthDay }) => {
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-xl border text-center transition-all shrink-0 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {dayName}
                        </span>
                        <span className={`text-xs font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {monthDay}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Slot Selection with TWO COLOURS ONLY */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    2. Select Appointment Slot
                  </label>

                  {/* Strictly TWO COLOURS LEGEND */}
                  <SlotLegend compact={true} />
                </div>

                {isLoadingSlots ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Checking doctor availability for {selectedDate}...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {slots.map((slot) => {
                      const isAvailable = slot.status === 'available';
                      const isSelected = selectedSlot === slot.time;
                      const isCurrentPatientSlot = slot.bookedByCurrentPatient;

                      // EXACTLY TWO COLOURS:
                      // Green for Available, Red for Booked / Unavailable
                      if (isAvailable) {
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`py-3 px-3 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-102 ring-2 ring-emerald-400'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            <span className="text-xs font-bold">{slot.time}</span>
                            <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                              Available (Green)
                            </span>
                          </button>
                        );
                      }

                      // Booked / Unavailable: STRICTLY RED
                      return (
                        <div
                          key={slot.time}
                          className="py-3 px-3 rounded-xl text-xs font-medium border bg-rose-50 text-rose-800 border-rose-200 flex flex-col items-center justify-center opacity-75 cursor-not-allowed select-none"
                          title={isCurrentPatientSlot ? 'Your booked slot' : 'Slot already booked'}
                        >
                          <span className="text-xs font-bold line-through text-rose-700">{slot.time}</span>
                          <span className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            {isCurrentPatientSlot ? 'Your Booking (Red)' : 'Booked (Red)'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Reason / Clinical Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  3. Reason for Visit (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Follow-up for blood pressure check, persistent headache, prescription renewal..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* 4. Affordable Healthcare Fee Breakdown */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Standard Consultation Fee:</span>
                  <span className="font-semibold text-slate-800">₹{originalFee}</span>
                </div>

                {discountNote && (
                  <div className="flex items-center justify-between text-xs text-teal-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-teal-600" />
                      {discountNote}:
                    </span>
                    <span>-₹{originalFee - finalFee}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Final Payable at Reception:</span>
                    <span className="text-[10px] text-slate-500">No hidden booking fees · Pay at clinic</span>
                  </div>
                  <span className={`text-xl font-extrabold ${finalFee === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {finalFee === 0 ? 'FREE (₹0)' : `₹${finalFee}`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!bookingConfirmed && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleBooking}
              disabled={!selectedSlot || isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
                !selectedSlot || isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white shadow-md'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving Slot & Generating Token...</span>
                </>
              ) : user && !user.isEmailVerified ? (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Verify Email to Book</span>
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  <span>Confirm Appointment ({selectedSlot || 'Select Slot'})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerifyModal}
        onClose={() => setShowEmailVerifyModal(false)}
        email={user?.email || ''}
        mode="registration"
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
