import React, { useState, useEffect } from 'react';
import { Doctor, SpecialtyMeta } from '../types/index.ts';
import { api } from '../services/api.ts';
import { DoctorCard } from '../components/DoctorCard.tsx';
import {
  Search,
  Filter,
  RotateCcw,
  Stethoscope,
  Sparkles,
  HeartHandshake,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface DoctorDirectoryPageProps {
  initialSpecialty?: string;
  initialSearch?: string;
  initialOffersFree?: boolean;
  onBookDoctor: (doctor: Doctor) => void;
  onViewDoctorProfile: (doctor: Doctor) => void;
}

export const DoctorDirectoryPage: React.FC<DoctorDirectoryPageProps> = ({
  initialSpecialty = 'all',
  initialSearch = '',
  initialOffersFree = false,
  onBookDoctor,
  onViewDoctorProfile,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyMeta[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [maxFee, setMaxFee] = useState<number | undefined>(undefined);
  const [minExp, setMinExp] = useState<number | undefined>(undefined);
  const [offersFreeOnly, setOffersFreeOnly] = useState(initialOffersFree);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with prop updates if changed externally
  useEffect(() => {
    if (initialSpecialty) setSelectedSpecialty(initialSpecialty);
    if (initialSearch !== undefined) setSearch(initialSearch);
    if (initialOffersFree !== undefined) setOffersFreeOnly(initialOffersFree);
  }, [initialSpecialty, initialSearch, initialOffersFree]);

  // Load specialties list once
  useEffect(() => {
    api.getSpecialties().then((res) => setSpecialties(res.specialties));
  }, []);

  // Fetch doctors with current filters
  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDoctors({
        specialty: selectedSpecialty,
        search,
        maxFee,
        minExperience: minExp,
        offersFree: offersFreeOnly,
      });
      setDoctors(res.doctors);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty, maxFee, minExp, offersFreeOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDoctors();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedSpecialty('all');
    setMaxFee(undefined);
    setMinExp(undefined);
    setOffersFreeOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Directory Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
            Verified Healthcare Specialists
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Doctor Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Browse verified practitioners across all 18 medical specialties with transparent fees and instant appointment slot reservation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Top Search Line */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor by name, qualification, or clinic..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Specialty Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Medical Specialty
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="all">All 18 Specialties</option>
              {specialties.map((spec) => (
                <option key={spec.name} value={spec.name}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Consultation Fee Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Max Consultation Fee
            </label>
            <select
              value={maxFee !== undefined ? String(maxFee) : 'any'}
              onChange={(e) =>
                setMaxFee(e.target.value === 'any' ? undefined : Number(e.target.value))
              }
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="any">Any Consultation Fee</option>
              <option value="150">Low-Cost (Up to ₹150)</option>
              <option value="250">Standard (Up to ₹250)</option>
              <option value="350">Specialist (Up to ₹350)</option>
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Clinical Experience
            </label>
            <select
              value={minExp !== undefined ? String(minExp) : 'any'}
              onChange={(e) =>
                setMinExp(e.target.value === 'any' ? undefined : Number(e.target.value))
              }
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="any">Any Experience</option>
              <option value="5">5+ Years Experience</option>
              <option value="10">10+ Years Experience</option>
              <option value="15">15+ Years Senior Specialist</option>
            </select>
          </div>

          {/* Free Care Checkbox */}
          <div className="flex items-center sm:pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={offersFreeOnly}
                onChange={(e) => setOffersFreeOnly(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="flex items-center gap-1 text-emerald-800">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Free Consultations Only (₹0)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading verified doctors...</p>
          <p className="text-xs text-slate-400 mt-1">Filtering schedule and slot availability</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No doctors matched your selected filters
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your specialty choice, search terms, or fee thresholds to discover available doctors.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing <strong>{doctors.length}</strong> active verified doctors</span>
            <span>Two-Colour Slot System: Green = Available · Red = Booked</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onBook={onBookDoctor}
                onViewProfile={onViewDoctorProfile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
