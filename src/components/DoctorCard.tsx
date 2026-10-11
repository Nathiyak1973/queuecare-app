import React from 'react';
import { Doctor } from '../types/index.ts';
import {
  Star,
  Clock,
  Building2,
  Calendar,
  CheckCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
  onViewProfile: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onBook,
  onViewProfile,
}) => {
  const hasDiscount = doctor.discountedFee !== undefined && doctor.discountedFee < doctor.consultationFee;
  const isFree = doctor.offersFreeConsultation && doctor.consultationFee === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        {/* Top Header: Avatar + Primary Info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs group-hover:scale-102 transition-transform"
            />
            {doctor.isVerified && (
              <span
                title="Verified Healthcare Practitioner"
                className="absolute -bottom-1 -right-1 bg-teal-600 text-white rounded-full p-0.5 border-2 border-white shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                {doctor.name}
              </h3>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                <span>{doctor.rating.toFixed(1)}</span>
                <span className="text-amber-500 font-normal">({doctor.totalReviews})</span>
              </div>
            </div>

            <p className="text-xs font-semibold text-teal-700 mt-0.5">
              {doctor.specialty}
            </p>

            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {doctor.qualifications} · {doctor.experienceYears} yrs experience
            </p>
          </div>
        </div>

        {/* Clinic / Hospital Affiliation */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.hospitalAffiliation}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {doctor.workingHours.start} – {doctor.workingHours.end} (Avg {doctor.consultationDurationMinutes} min / patient)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Days: {doctor.availableDays.slice(0, 3).join(', ')}
              {doctor.availableDays.length > 3 ? ` +${doctor.availableDays.length - 3} more` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Bar and Action Buttons */}
      <div className="bg-slate-50/80 px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Pricing Info */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Consultation Fee
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            {isFree ? (
              <span className="text-sm font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                FREE (₹0)
              </span>
            ) : hasDiscount ? (
              <>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{doctor.discountedFee}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  ₹{doctor.consultationFee}
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded">
                  Subsidized
                </span>
              </>
            ) : (
              <span className="text-base font-extrabold text-slate-900">
                ₹{doctor.consultationFee}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onViewProfile(doctor)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => onBook(doctor)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 shadow-xs hover:shadow-sm flex items-center gap-1 transition-all"
          >
            <span>Book Slot</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
