import React, { useState, useEffect } from 'react';
import { Doctor, AppointmentSlot, Appointment } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SlotLegend } from '../components/SlotLegend.tsx';
import {
  ArrowLeft,
  Star,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  Tag,
  AlertCircle,
  Ticket,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface DoctorProfilePageProps {
  doctor: Doctor;
  onBack: () => void;
  onViewExistingAppointment: (appointment: Appointment) => void;
  onRequireLogin: () => void;
}

export const DoctorProfilePage: React.FC<DoctorProfilePageProps> = ({
  doctor,
  onBack,
  onViewExistingAppointment,
  onRequireLogin,
}) => {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [existingAppointment, setExistingAppointment] = useState<Appointment | null>(null);
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [notes, setNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAppointment, setSuccessAppointment] = useState<Appointment | null>(null);

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
      console.error('Error loading slots:', err);
      setErrorMessage(err.message || 'Unable to retrieve slots.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlots(selectedDate);
  }, [doctor.id, selectedDate]);

  const dateOptions = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dateStr, dayName, monthDay };
  });

  // Calculate pricing
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

  const handleBook = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please select an available green slot.');
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
      setSuccessAppointment(res.appointment);
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
        setErrorMessage(err.message || 'Booking conflict. Please choose another green slot.');
      }
      loadSlots(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Doctor Directory</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Doctor Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="text-center space-y-3">
              <div className="relative inline-block mx-auto">
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-28 h-28 rounded-3xl object-cover border-4 border-slate-100 shadow-sm mx-auto"
                />
                {doctor.isVerified && (
                  <span className="absolute bottom-0 right-0 bg-teal-600 text-white rounded-full p-1 border-2 border-white shadow-xs">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{doctor.name}</h1>
                <p className="text-xs font-semibold text-teal-700 mt-0.5">{doctor.specialty}</p>
                <p className="text-xs text-slate-500 mt-0.5">{doctor.qualifications}</p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{doctor.rating.toFixed(1)} Rating</span>
                <span className="text-amber-500 font-normal">({doctor.totalReviews} reviews)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 block">Hospital / Clinic</span>
                  <span>{doctor.hospitalAffiliation}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 block">Consultation Duration</span>
                  <span>{doctor.consultationDurationMinutes} mins / patient queue slot</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 block">Available Days</span>
                  <span>{doctor.availableDays.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Doctor Bio */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                About the Specialist
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{doctor.bio}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Slot Booking Widget with strictly TWO COLOURS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
                  Interactive Appointment Booking
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Choose Date & Appointment Slot
                </h2>
              </div>
              <SlotLegend compact={true} />
            </div>

            {/* Success state */}
            {successAppointment ? (
              <div className="text-center py-8 space-y-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 p-6">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Appointment Confirmed!</h3>
                <div className="max-w-xs mx-auto bg-white border-2 border-teal-300 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">Queue Token</span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 block my-1">
                    {successAppointment.queueToken}
                  </span>
                  <p className="text-xs text-slate-500">
                    Position #{successAppointment.queueNumber} · Est. Wait ~{successAppointment.estimatedWaitMinutes} mins
                  </p>
                </div>
                <p className="text-xs text-slate-600">
                  Booked for <strong>{successAppointment.date}</strong> at <strong>{successAppointment.timeSlot}</strong>
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setSuccessAppointment(null);
                      loadSlots(selectedDate);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
                  >
                    Book Another Slot
                  </button>
                  <button
                    onClick={() => onViewExistingAppointment(successAppointment)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white"
                  >
                    View in My Appointments
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Existing appointment warning */}
                {hasActiveAppointment && existingAppointment && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">Existing Appointment Active</h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          You already have an appointment with this doctor on {selectedDate} (Token: <strong className="font-mono">{existingAppointment.queueToken}</strong> at {existingAppointment.timeSlot}).
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Please view your existing appointment or choose another available slot.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onViewExistingAppointment(existingAppointment)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>View Existing Appointment</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {errorMessage && !hasActiveAppointment && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. Date selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    1. Select Date
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

                {/* 2. Slot selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    2. Available Slots (Only Two Colours: Green = Available, Red = Booked)
                  </label>

                  {isLoadingSlots ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Checking slot availability...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {slots.map((slot) => {
                        const isAvailable = slot.status === 'available';
                        const isSelected = selectedSlot === slot.time;
                        const isCurrentPatientSlot = slot.bookedByCurrentPatient;

                        if (isAvailable) {
                          return (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedSlot(slot.time)}
                              className={`py-3 px-3 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
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

                        return (
                          <div
                            key={slot.time}
                            className="py-3 px-3 rounded-xl text-xs font-medium border bg-rose-50 text-rose-800 border-rose-200 flex flex-col items-center justify-center opacity-75 cursor-not-allowed select-none"
                            title={isCurrentPatientSlot ? 'Your booked slot' : 'Booked'}
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

                {/* 3. Reason */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    3. Reason for Visit (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief description of symptoms or consultation reason..."
                    rows={2}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Fee summary & booking button */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Payable Fee at Hospital:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {finalFee === 0 ? 'FREE (₹0)' : `₹${finalFee}`}
                      </span>
                      {discountNote && (
                        <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                          {discountNote}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || isSubmitting}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      !selectedSlot || isSubmitting
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white shadow-md'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming Slot...</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Confirm Booking ({selectedSlot || 'Pick a Slot'})</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
