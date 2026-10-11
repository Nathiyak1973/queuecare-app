import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  RotateCw,
  KeyRound,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegistrationSuccess: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onRegistrationSuccess,
}) => {
  const { register, verifyEmail } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email verification step states
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationOtp, setVerificationOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(900); // 15 mins
  const [devSentEmail, setDevSentEmail] = useState<any | null>(null);
  const [showDevInspector, setShowDevInspector] = useState(false);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Expiry countdown
  useEffect(() => {
    if (!isVerificationStep || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isVerificationStep, expirySeconds]);

  const fetchDevRecentEmail = async (target: string) => {
    try {
      const res = await api.getRecentEmails();
      if (res.emails && res.emails.length > 0) {
        const found = res.emails.find((m: any) =>
          m.to?.toLowerCase().includes(target.toLowerCase())
        );
        setDevSentEmail(found || res.emails[0]);
      }
    } catch {
      // ignore
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score, text: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score, text: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score, text: 'Good', color: 'bg-sky-500' };
      case 4:
      default:
        return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  // File upload handler for avatar
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Profile image must be less than 2MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setAvatar(result);
        setCustomAvatarUrl('');
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Required field checks
    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Mobile number is required.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid mobile number (8 to 15 digits).');
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage('Date of birth is required.');
      return;
    }

    if (!gender) {
      setErrorMessage('Gender selection is required.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Residential address is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Password must contain both letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalAvatar = customAvatarUrl.trim() || avatar;
      const targetCleanEmail = email.trim().toLowerCase();
      await register({
        name: name.trim(),
        email: targetCleanEmail,
        password,
        phone: phone.trim(),
        dateOfBirth,
        gender,
        address: address.trim(),
        avatar: finalAvatar,
      });

      setRegisteredEmail(targetCleanEmail);
      setIsVerificationStep(true);
      setSuccessMessage('A verification email has been sent to your email address. Please verify your email to activate your account.');
      setResendCooldown(60);
      setExpirySeconds(900);
      setTimeout(() => {
        fetchDevRecentEmail(targetCleanEmail);
      }, 500);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'An error occurred during registration. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationOtp.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (verificationOtp.trim().length !== 6) {
      setErrorMessage('Verification code must be exactly 6 digits.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await verifyEmail({ email: registeredEmail, otp: verificationOtp.trim() });
      setSuccessMessage('Email verified successfully! Welcome to QueueCare.');
      setTimeout(() => {
        onRegistrationSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.resendVerification(registeredEmail);
      setSuccessMessage(res.message || 'A fresh verification email has been sent to your email address.');
      setResendCooldown(res.cooldownSeconds || 60);
      setExpirySeconds(900);
      setTimeout(() => {
        fetchDevRecentEmail(registeredEmail);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification email.');
      if (err.cooldownRemaining) {
        setResendCooldown(err.cooldownRemaining);
      }
    } finally {
      setIsResending(false);
    }
  };

  const autofillDevCode = () => {
    if (devSentEmail?.otp) {
      setVerificationOtp(devSentEmail.otp);
      setErrorMessage(null);
    }
  };

  const minutesRemaining = Math.floor(expirySeconds / 60);
  const secondsRemaining = expirySeconds % 60;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Registration Header */}
        <div className="bg-gradient-to-r from-teal-800 via-sky-900 to-slate-900 p-8 text-white text-center relative">
          <div className="inline-block mb-3">
            <Logo variant="auth" showTagline={true} className="brightness-125" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Patient Registration
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-lg mx-auto mt-1">
            Create your QueueCare patient account to access transparent healthcare, book verified doctor appointments, and skip crowded physical waiting lines.
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-300">
            <span>Already registered with QueueCare?</span>
            <button
              onClick={onNavigateToLogin}
              className="text-teal-300 hover:text-white font-bold underline transition-colors"
            >
              Sign In Here
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="px-6 sm:px-10 pt-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}
        </div>

        {isVerificationStep ? (
          /* STEP 2: EMAIL VERIFICATION STEP */
          <div className="p-6 sm:p-10 space-y-6">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 border-2 border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-xs">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Check Your Inbox
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                A verification email has been sent to your email address. Please verify your email to activate your account.
              </p>
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-slate-800">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>{registeredEmail}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    6-Digit Verification Code
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Expires in {minutesRemaining}:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                  </span>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={verificationOtp}
                  onChange={(e) => {
                    setVerificationOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                    setErrorMessage(null);
                  }}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-3xl font-extrabold tracking-[10px] font-mono py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-teal-500 focus:outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || verificationOtp.length !== 6}
                className="w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Activate Account</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="font-bold text-teal-700 hover:text-teal-900 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend Verification Email in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVerificationStep(false)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>

              {/* Dev Testing Helper Drawer */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-xs space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-teal-700" />
                    Live Demo / Testing Code Inspector
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDevInspector(!showDevInspector)}
                    className="text-[11px] font-bold text-teal-700 underline cursor-pointer"
                  >
                    {showDevInspector ? 'Hide' : 'View Sent Email'}
                  </button>
                </div>

                {devSentEmail?.otp && (
                  <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-teal-700 block">Generated Verification OTP:</span>
                      <span className="font-mono text-lg font-black text-teal-950 tracking-wider">
                        {devSentEmail.otp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={autofillDevCode}
                      className="px-3 py-1 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
                    >
                      Autofill Code
                    </button>
                  </div>
                )}

                {showDevInspector && devSentEmail && (
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-teal-200 text-[11px] font-mono text-slate-700 space-y-1">
                    <div><strong>Subject:</strong> {devSentEmail.subject}</div>
                    <div><strong>To:</strong> {devSentEmail.to}</div>
                    <div><strong>Sent:</strong> {new Date(devSentEmail.sentAt).toLocaleTimeString()}</div>
                    {devSentEmail.verificationUrl && (
                      <div className="pt-1">
                        <span className="text-slate-500 block">Verification Link:</span>
                        <a
                          href={devSentEmail.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 underline break-all flex items-center gap-1"
                        >
                          {devSentEmail.verificationUrl}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Skip option */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onRegistrationSuccess}
                  className="text-xs text-slate-500 hover:text-slate-700 underline font-medium cursor-pointer"
                >
                  Skip for now & go to dashboard (Email stays unverified)
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 1: REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6">
          {/* Section: Profile Photo */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Profile Photo (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative shrink-0">
                <img
                  src={customAvatarUrl || avatar}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-2 -right-2 p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full cursor-pointer shadow-md transition-colors"
                  title="Upload image from computer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Select a ready avatar preset, upload a photo, or paste an image URL:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(preset);
                        setCustomAvatarUrl('');
                      }}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                        avatar === preset && !customAvatarUrl
                          ? 'border-teal-600 scale-105 shadow-xs'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or enter image URL: https://example.com/photo.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Personal & Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Patient Personal & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Residential Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 402 Green Glen Layout, Bellandur, Bengaluru"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Password Security */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-teal-600" />
              Account Security Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Password */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 chars (letters + numbers)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Strength:</span>
                      <span className="font-bold text-slate-700">{passwordStrength.text}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-type your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-3 pr-10 py-2.5 rounded-xl border outline-none ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                    Passwords do not match
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Role Assurance Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              By registering, you will be assigned a secure <strong>Patient</strong> account automatically with protected medical records.
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-teal-600 via-sky-600 to-teal-700 hover:from-teal-700 hover:to-sky-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Patient Account...</span>
                </>
              ) : (
                <>
                  <span>Register Patient Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
