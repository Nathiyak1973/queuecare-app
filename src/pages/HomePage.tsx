import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo.tsx';
import { Doctor, SpecialtyMeta } from '../types/index.ts';
import { api } from '../services/api.ts';
import { DoctorCard } from '../components/DoctorCard.tsx';
import {
  Search,
  Clock,
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Brain,
  Bone,
  Baby,
  Flower2,
  Headphones,
  Eye,
  Smile,
  SmilePlus,
  Wind,
  ShieldAlert,
  Activity,
  Droplets,
  Cross,
  Accessibility,
  CheckCircle2,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, extra?: any) => void;
  onBookDoctor: (doctor: Doctor) => void;
  onViewDoctorProfile: (doctor: Doctor) => void;
}

// Icon mapper for all 18 specialties
const specialtyIconMap: Record<string, React.ReactNode> = {
  'General Physician': <Stethoscope className="w-5 h-5 text-teal-600" />,
  'Cardiologist': <HeartPulse className="w-5 h-5 text-rose-600" />,
  'Dermatologist': <Sparkles className="w-5 h-5 text-amber-600" />,
  'Neurologist': <Brain className="w-5 h-5 text-indigo-600" />,
  'Orthopedic Doctor': <Bone className="w-5 h-5 text-slate-700" />,
  'Pediatrician': <Baby className="w-5 h-5 text-sky-600" />,
  'Gynecologist': <Flower2 className="w-5 h-5 text-pink-600" />,
  'ENT Specialist': <Headphones className="w-5 h-5 text-purple-600" />,
  'Ophthalmologist': <Eye className="w-5 h-5 text-blue-600" />,
  'Dentist': <Smile className="w-5 h-5 text-teal-600" />,
  'Psychiatrist': <SmilePlus className="w-5 h-5 text-emerald-600" />,
  'Pulmonologist': <Wind className="w-5 h-5 text-cyan-600" />,
  'Gastroenterologist': <ShieldAlert className="w-5 h-5 text-amber-700" />,
  'Endocrinologist': <Activity className="w-5 h-5 text-violet-600" />,
  'Nephrologist': <Droplets className="w-5 h-5 text-blue-700" />,
  'Urologist': <Cross className="w-5 h-5 text-teal-700" />,
  'Oncologist': <ShieldCheck className="w-5 h-5 text-rose-700" />,
  'Physiotherapist': <Accessibility className="w-5 h-5 text-emerald-700" />,
};

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onBookDoctor,
  onViewDoctorProfile,
}) => {
  const [specialties, setSpecialties] = useState<SpecialtyMeta[]>([]);
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [specRes, docRes] = await Promise.all([
          api.getSpecialties(),
          api.getDoctors({ maxFee: 300 }),
        ]);
        setSpecialties(specRes.specialties);
        setFeaturedDoctors(docRes.doctors.slice(0, 4));
      } catch (err) {
        console.error('Home page data load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('directory', { search: searchQuery.trim() });
    } else {
      onNavigate('directory');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-teal-50/30 to-white pt-12 pb-16 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tagline / Subtitle */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/70 border border-teal-200/80 text-teal-900 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
              <span>QueueCare – Less Wait · More Care</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Patient Appointments & <br />
              <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Live Queue Management
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
              Book doctor consultations with a strict two-colour slot system: Green for Available, Red for Booked. Track your queue token in real time with transparent, affordable healthcare.
            </p>

            {/* Hero Search Box */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
              <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200/80 flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctors, symptoms, or any of the 18 medical specialties..."
                  className="w-full text-sm py-2 px-2 text-slate-800 placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-sm"
                >
                  Find Doctors
                </button>
              </div>
            </form>

            {/* Quick Demonstration Pricing Chips */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Subsidized Pricing:</span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                General Physician: <strong>₹100–₹200</strong>
              </span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                Specialist: <strong>₹200–₹400</strong>
              </span>
              <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-300 font-semibold">
                Approved Free Consultations: ₹0
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of QueueCare */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Less Waiting Time</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Live queue tokens (e.g. CARD-001) track your position and estimated waiting time so you arrive right on time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Simple Two-Colour Slots</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              No ambiguity: Green slots are Available to pick, Red slots are Booked or Unavailable.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6 text-sky-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3. 18 Verified Specialties</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              From General Physicians to Cardiologists and Oncologists, all doctors are vetted and credentialed.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">4. Affordable Care & Aid</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Income-based fee concessions, transparent rates, and administrative financial aid applications.
            </p>
          </div>
        </div>
      </section>

      {/* 18 Medical Specialties Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
              Comprehensive Medical Coverage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Explore All 18 Doctor Specialties
            </h2>
          </div>
          <button
            onClick={() => onNavigate('directory')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors"
          >
            <span>View Full Directory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {specialties.map((spec) => (
            <button
              key={spec.name}
              onClick={() => onNavigate('directory', { specialty: spec.name })}
              className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-teal-50 border border-slate-200 group-hover:border-teal-200 flex items-center justify-center mb-3 transition-colors">
                  {specialtyIconMap[spec.name] || <Stethoscope className="w-5 h-5 text-teal-600" />}
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-tight line-clamp-2">
                  {spec.name}
                </h3>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-teal-700">{spec.code}</span>
                <span>{spec.doctorCount ?? 1} drs</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Doctors for Instant Booking */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
              Verified Practitioners
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Popular Doctors Ready for Appointments
            </h2>
          </div>
          <button
            onClick={() => onNavigate('directory')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors"
          >
            <span>See All Doctors</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onBook={onBookDoctor}
              onViewProfile={onViewDoctorProfile}
            />
          ))}
        </div>
      </section>

      {/* Affordable Healthcare & Financial Assistance Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block">
              Healthcare Equity For Everyone
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Quality Healthcare Should Never Be Out of Financial Reach
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If you or your family face financial hardship, QueueCare provides subsidized consultation fees and 100% free care slots through our administrative assistance fund.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('affordable-care')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm"
              >
                Apply for Financial Aid
              </button>
              <button
                onClick={() => onNavigate('directory', { offersFree: true })}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
              >
                View Free Consultation Slots (₹0)
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
