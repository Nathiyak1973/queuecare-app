import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Doctor, FinancialAssistanceRequest } from '../types/index.ts';
import { DoctorCard } from '../components/DoctorCard.tsx';
import {
  HeartHandshake,
  Tag,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface AffordableCarePageProps {
  onNavigate: (tab: string, extra?: any) => void;
  onOpenFinancialAid: () => void;
  onBookDoctor: (doctor: Doctor) => void;
  onViewDoctorProfile: (doctor: Doctor) => void;
}

export const AffordableCarePage: React.FC<AffordableCarePageProps> = ({
  onNavigate,
  onOpenFinancialAid,
  onBookDoctor,
  onViewDoctorProfile,
}) => {
  const { user } = useAuth();
  const [subsidizedDoctors, setSubsidizedDoctors] = useState<Doctor[]>([]);
  const [freeDoctors, setFreeDoctors] = useState<Doctor[]>([]);
  const [myRequests, setMyRequests] = useState<FinancialAssistanceRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'low-cost'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, freeRes] = await Promise.all([
          api.getDoctors({ maxFee: 200 }),
          api.getDoctors({ offersFree: true }),
        ]);
        setSubsidizedDoctors(subRes.doctors);
        setFreeDoctors(freeRes.doctors);

        if (user) {
          const reqRes = await api.getMyFinancialRequests();
          setMyRequests(reqRes.requests);
        }
      } catch (err) {
        console.error('Failed to load affordable care page:', err);
      }
    }
    loadData();
  }, [user]);

  const displayedDoctors =
    activeFilter === 'free'
      ? freeDoctors
      : activeFilter === 'low-cost'
      ? subsidizedDoctors
      : Array.from(new Set([...freeDoctors, ...subsidizedDoctors]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>QueueCare Healthcare Equity Mission</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Affordable Healthcare & Financial Concessions
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          QueueCare connects patients directly to subsidized hospital clinics and accredited community doctors. We ensure zero hidden booking charges, capped consultation rates, and administrative aid for patients experiencing financial hardship.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenFinancialAid}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm"
          >
            Apply for Financial Aid Application
          </button>
          <button
            onClick={() => setActiveFilter('free')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
          >
            Filter Free Consultations (₹0)
          </button>
        </div>
      </div>

      {/* Demonstration Pricing Grid */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
            Fee Transparency
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Demonstration Consultation Rate Tiers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standard pricing benchmarks maintained across the QueueCare clinical network. All fees are payable directly at clinic reception.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
              Tier 1: Primary Care
            </span>
            <div className="text-2xl font-extrabold text-slate-900">₹100 – ₹200</div>
            <h4 className="text-xs font-bold text-slate-800">General Physician Consultations</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fever evaluations, blood pressure reviews, seasonal illnesses, and routine outpatient checkups.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
              Tier 2: Specialists
            </span>
            <div className="text-2xl font-extrabold text-slate-900">₹200 – ₹400</div>
            <h4 className="text-xs font-bold text-slate-800">Advanced Specialty Clinics</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cardiology, Neurology, Pediatrics, Orthopedics, Gynecology, and Dermatology consultations.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
              Tier 3: Subsidized
            </span>
            <div className="text-2xl font-extrabold text-slate-900">₹0 – ₹100</div>
            <h4 className="text-xs font-bold text-slate-800">Community Outreach Hours</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Special clinic sessions offered by participating doctors and charity health foundations.
            </p>
          </div>

          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-300 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Tier 4: Financial Aid
            </span>
            <div className="text-2xl font-extrabold text-emerald-700">₹0 (100% Free)</div>
            <h4 className="text-xs font-bold text-emerald-900">Approved Free Healthcare</h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Full consultation waiver for eligible lower-income families upon administrative review.
            </p>
          </div>
        </div>
      </section>

      {/* Patient's Current Aid Applications (If logged in) */}
      {user && myRequests.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Your Financial Assistance Applications ({myRequests.length})
              </h3>
              <p className="text-xs text-slate-500">Track application status and approved discount percentages</p>
            </div>
            <button
              onClick={onOpenFinancialAid}
              className="text-xs font-bold text-teal-700 hover:text-teal-800"
            >
              + Submit Another Request
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myRequests.map((req) => (
              <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{req.requestedSpecialty}</span>
                    <span className="text-slate-400">· Income: {req.annualIncomeRange}</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5">{req.reason}</p>
                  {req.adminRemarks && (
                    <p className="text-teal-700 text-[11px] mt-1">Admin note: {req.adminRemarks}</p>
                  )}
                </div>

                <div className="shrink-0">
                  {req.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Approved: {req.grantedDiscountPercent}% Off
                    </span>
                  )}
                  {req.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Under Review
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filterable Subsidized & Free Doctors List */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
              Participating Practitioners
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Available Free & Low-Cost Doctor Consultations
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Affordable ({subsidizedDoctors.length + freeDoctors.length})
            </button>
            <button
              onClick={() => setActiveFilter('free')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'free'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Free Only (₹0) ({freeDoctors.length})
            </button>
            <button
              onClick={() => setActiveFilter('low-cost')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'low-cost'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low-Cost (≤ ₹200) ({subsidizedDoctors.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onBook={onBookDoctor}
              onViewProfile={onViewDoctorProfile}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
