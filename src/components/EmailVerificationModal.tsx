import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RotateCw,
  X,
  KeyRound,
  ExternalLink,
  Info,
} from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  mode?: 'registration' | 'email_change';
  newEmail?: string;
  onSuccess?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  mode = 'registration',
  newEmail,
  onSuccess,
}) => {
  const { user, refreshUser, verifyEmail } = useAuth();

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown timer in seconds
  const [cooldown, setCooldown] = useState<number>(0);
  // Code expiry countdown in seconds (15 minutes = 900 seconds)
  const [expiresIn, setExpiresIn] = useState<number>(900);

  // Dev Inspection Drawer
  const [devEmail, setDevEmail] = useState<any | null>(null);
  const [showDevInspector, setShowDevInspector] = useState(false);

  const targetEmail = mode === 'email_change' && newEmail ? newEmail : (email || user?.email || '');

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setExpiresIn(900);
      fetchRecentEmail();
    }
  }, [isOpen, targetEmail]);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Expiry countdown effect
  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresIn]);

  const fetchRecentEmail = async () => {
    try {
      const res = await api.getRecentEmails();
      if (res.emails && res.emails.length > 0) {
        const found = res.emails.find(
          (m: any) =>
            m.to?.toLowerCase().includes(targetEmail.toLowerCase()) ||
            (mode === 'email_change' && m.type?.includes('email_change'))
        );
        setDevEmail(found || res.emails[0]);
      }
    } catch {
      // ignore
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(val);
    setErrorMessage(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (otp.trim().length !== 6) {
      setErrorMessage('Verification code must be exactly 6 digits.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'email_change') {
        const res = await api.verifyEmailChange({ otp: otp.trim() });
        setSuccessMessage(res.message || 'Email address successfully updated and verified!');
        await refreshUser();
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        const res = await verifyEmail({ email: targetEmail, otp: otp.trim() });
        setSuccessMessage(res.message || 'Email successfully verified! Your account is active.');
        await refreshUser();
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'email_change') {
        const res = await api.resendEmailChange();
        setSuccessMessage(res.message);
        setCooldown(res.cooldownSeconds || 60);
      } else {
        const res = await api.resendVerification(targetEmail);
        setSuccessMessage(res.message);
        setCooldown(res.cooldownSeconds || 60);
      }
      setExpiresIn(900);
      setTimeout(fetchRecentEmail, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification email.');
      if (err.cooldownRemaining) {
        setCooldown(err.cooldownRemaining);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCancelEmailChange = async () => {
    if (mode !== 'email_change') return;
    setIsCancelling(true);
    try {
      const res = await api.cancelEmailChange();
      await refreshUser();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel email change request.');
    } finally {
      setIsCancelling(false);
    }
  };

  const autofillDevCode = () => {
    if (devEmail?.otp) {
      setOtp(devEmail.otp);
      setErrorMessage(null);
    }
  };

  if (!isOpen) return null;

  const minutesRemaining = Math.floor(expiresIn / 60);
  const secondsRemaining = expiresIn % 60;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-teal-700 via-sky-800 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-300/30 flex items-center justify-center text-teal-300 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                QueueCare Security
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                {mode === 'email_change' ? 'Confirm New Email Address' : 'Verify Your Email Address'}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Target Email Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {mode === 'email_change' ? 'A verification code was sent to your new email:' : 'A verification email has been sent to:'}
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-teal-800 break-all pl-6">
              {targetEmail}
            </div>

            {mode === 'email_change' && (
              <p className="text-[11px] text-slate-500 pl-6 pt-1 border-t border-slate-200">
                Your current email (<strong className="text-slate-700">{user?.email}</strong>) remains your active and verified email until this code is submitted.
              </p>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Verification Code Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  6-Digit Verification Code
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  Expires in {minutesRemaining}:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-3xl font-extrabold tracking-[10px] font-mono py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-teal-500 focus:outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{mode === 'email_change' ? 'Confirm Email Change' : 'Verify & Activate Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Resend & Cancel Actions */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="font-bold text-teal-700 hover:text-teal-900 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Verification Code'}
              </span>
            </button>

            {mode === 'email_change' && (
              <button
                type="button"
                onClick={handleCancelEmailChange}
                disabled={isCancelling}
                className="font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            )}
          </div>

          {/* Test / Dev Verification Inspection Box */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-teal-700" />
                Live Demo / Testing Helper
              </span>
              <button
                type="button"
                onClick={() => setShowDevInspector(!showDevInspector)}
                className="text-[11px] font-bold text-teal-700 underline"
              >
                {showDevInspector ? 'Hide' : 'View Sent Email'}
              </button>
            </div>

            {devEmail && devEmail.otp && (
              <div className="mt-2.5 pt-2.5 border-t border-teal-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-teal-800 block">Latest Generated Code:</span>
                  <span className="font-mono text-base font-extrabold text-teal-950 tracking-wider">
                    {devEmail.otp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={autofillDevCode}
                  className="px-3 py-1 rounded-lg bg-teal-600 text-white font-bold text-[11px] hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Autofill Code
                </button>
              </div>
            )}

            {showDevInspector && devEmail && (
              <div className="mt-3 p-2.5 bg-white rounded-xl border border-teal-200 text-[11px] font-mono text-slate-700 space-y-1 overflow-x-auto">
                <div><strong>Subject:</strong> {devEmail.subject}</div>
                <div><strong>To:</strong> {devEmail.to}</div>
                <div><strong>Sent:</strong> {new Date(devEmail.sentAt).toLocaleTimeString()}</div>
                {devEmail.verificationUrl && (
                  <div className="pt-1">
                    <span className="text-slate-500 block">Direct Link:</span>
                    <a
                      href={devEmail.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 underline break-all flex items-center gap-1"
                    >
                      {devEmail.verificationUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
