import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
  onOpenFullRegisterPage?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  onOpenFullRegisterPage,
}) => {
  const { login, register, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);

  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setError('Email and password are required.');
          setIsLoading(false);
          return;
        }
        await login(email.trim(), password);
      } else {
        // Register validations
        if (!name.trim()) {
          setError('Full name is required.');
          setIsLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Email address is required.');
          setIsLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError('Mobile number is required.');
          setIsLoading(false);
          return;
        }
        if (!dateOfBirth) {
          setError('Date of birth is required.');
          setIsLoading(false);
          return;
        }
        if (!gender) {
          setError('Gender is required.');
          setIsLoading(false);
          return;
        }
        if (!address.trim()) {
          setError('Residential address is required.');
          setIsLoading(false);
          return;
        }
        if (!password) {
          setError('Password is required.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasLetter || !hasNumber) {
          setError('Password must contain both letters and numbers.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Password and Confirm Password do not match.');
          setIsLoading(false);
          return;
        }

        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          dateOfBirth,
          gender,
          address: address.trim(),
          avatar,
        });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginAsDemo(demoRole);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className={`relative w-full ${mode === 'register' ? 'max-w-xl' : 'max-w-md'} bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col`}>
        {/* Top Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
          aria-label="Close authentication dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Auth Header */}
        <div className="pt-6 pb-4 px-6 text-center border-b border-slate-100 shrink-0">
          <div className="inline-block mb-2">
            <Logo variant="compact" showTagline={true} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Sign In to QueueCare' : 'Patient Registration'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'login'
              ? 'Access your appointment schedule and live queue tokens'
              : 'Create your patient account with verified medical records'}
          </p>

          {/* Tab Switcher */}
          <div className="mt-3 flex p-1 bg-slate-100 rounded-xl max-w-xs mx-auto">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Quick Demo Login Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
            <span className="flex items-center gap-1 text-teal-800">
              <Sparkles className="w-3 h-3 text-teal-600" />
              1-Click Demo Testing:
            </span>
            <span className="text-slate-400">Pre-seeded accounts</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('patient')}
              className="py-1 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('doctor')}
              className="py-1 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'register' ? (
              <>
                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
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
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
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
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
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
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-teal-500 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Residential Address */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 402 Green Glen Layout, Bengaluru"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* Avatar Preset Selector */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Profile Avatar Preset
                  </label>
                  <div className="flex items-center gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(preset)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          avatar === preset ? 'border-teal-600 scale-105 shadow-xs' : 'border-slate-200 opacity-70'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
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
                        className="w-full text-xs pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Re-type password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-xs pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* LOGIN MODE */
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 shadow-sm flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In to QueueCare' : 'Complete Patient Registration'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
