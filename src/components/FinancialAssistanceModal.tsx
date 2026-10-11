import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SPECIALTIES } from '../data/specialties.ts';
import {
  X,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface FinancialAssistanceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const FinancialAssistanceModal: React.FC<FinancialAssistanceModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [incomeRange, setIncomeRange] = useState<string>('Under ₹1,50,000 / year');
  const [requestedSpecialty, setRequestedSpecialty] = useState<string>('All Specialties');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a brief reason or background for your financial assistance request.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.submitFinancialRequest({
        annualIncomeRange: incomeRange,
        requestedSpecialty,
        reason: reason.trim(),
      });
      setIsSuccess(true);
      onSuccess();
    } catch (err: any) {
      console.error('Assistance request error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-sky-700 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Apply for Healthcare Assistance</h2>
              <p className="text-xs text-teal-100">QueueCare Subsidized & Concession Scheme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Application Submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Our healthcare administration team will review your application. Once approved, discounts (up to 100% free care) will automatically reflect at checkout.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-xs text-teal-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Confidential & Dignified Care
                </p>
                <p className="text-[11px] text-teal-700">
                  QueueCare assists individuals and families with lower annual incomes, daily-wage workers, students, and seniors.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Annual Household Income Bracket
                </label>
                <select
                  value={incomeRange}
                  onChange={(e) => setIncomeRange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:border-teal-500 outline-none"
                >
                  <option value="Under ₹1,00,000 / year">Under ₹1,00,000 / year (Priority Subsidy / BPL)</option>
                  <option value="Under ₹1,50,000 / year">₹1,00,000 – ₹1,50,000 / year</option>
                  <option value="₹1,50,000 – ₹3,00,000 / year">₹1,50,000 – ₹3,00,000 / year</option>
                  <option value="Above ₹3,00,000 with acute medical hardship">Above ₹3,00,000 with sudden medical hardship</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Primary Specialty Required
                </label>
                <select
                  value={requestedSpecialty}
                  onChange={(e) => setRequestedSpecialty(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:border-teal-500 outline-none"
                >
                  <option value="All Specialties">All Medical Specialties</option>
                  {SPECIALTIES.map((spec) => (
                    <option key={spec.name} value={spec.name}>
                      {spec.name} ({spec.typicalFeeRange})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Reason or Medical Need
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Please describe your clinical need or financial circumstance..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 shadow-xs transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
