import React from 'react';
import { Logo } from './Logo.tsx';
import { ShieldCheck, Clock, Heart, Award } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Logo & Tagline */}
          <div className="md:col-span-1 space-y-3">
            <div className="bg-slate-800/80 p-3 rounded-xl inline-block">
              <Logo
                variant="navbar"
                onClick={() => onNavigate('home')}
                showTagline={true}
                className="brightness-110"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              QueueCare simplifies outpatient appointments, reduces physical waiting room congestion, and promotes affordable healthcare access for all communities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Patient Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('directory')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Doctor Directory & Specialties
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('affordable-care')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Affordable Care & Subsidies
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('patient-dashboard')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Live Queue Tokens & Bookings
                </button>
              </li>
            </ul>
          </div>

          {/* Healthcare Principles */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Commitment to Transparency
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Real-time queue visibility with estimated wait times</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Zero hidden fees with income-based financial aid</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Verified medical specialists & strict duplicate prevention</span>
              </li>
            </ul>
          </div>

          {/* Operational Notice */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Clinical Disclaimer
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Queue tokens represent scheduled appointment order. Any emergency triage or urgent medical escalation is determined directly by licensed hospital clinical staff.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} QueueCare Health Systems. All rights reserved. Less Wait · More Care.</p>
          <div className="flex items-center gap-4">
            <span>Two-Colour Slot System: Green = Available · Red = Booked</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
