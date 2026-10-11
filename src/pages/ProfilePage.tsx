import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Doctor } from '../types/index.ts';
import { EmailVerificationModal } from '../components/EmailVerificationModal.tsx';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  HeartPulse,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Stethoscope,
  Building2,
  Clock,
  Edit3,
  X,
  Camera,
  Eye,
  EyeOff,
  Lock,
  RotateCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface ProfilePageProps {
  initialTab?: 'profile' | 'email' | 'password';
  initialIsEditing?: boolean;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  initialTab = 'profile',
  initialIsEditing = false,
}) => {
  const { user, refreshUser, isDoctor, isAdmin, isPatient } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'password'>(initialTab);
  const [isEditing, setIsEditing] = useState<boolean>(initialIsEditing);

  // Email verification modal for unverified account
  const [isVerifyAccountModalOpen, setIsVerifyAccountModalOpen] = useState(false);

  // Email change form states
  const [newEmailInput, setNewEmailInput] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [showPasswordForEmail, setShowPasswordForEmail] = useState(false);
  const [emailChangeOtp, setEmailChangeOtp] = useState('');
  const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);
  const [isVerifyingEmailChange, setIsVerifyingEmailChange] = useState(false);
  const [isResendingEmailChange, setIsResendingEmailChange] = useState(false);
  const [isCancellingEmailChange, setIsCancellingEmailChange] = useState(false);
  const [emailChangeCooldown, setEmailChangeCooldown] = useState(0);
  const [emailChangeExpirySeconds, setEmailChangeExpirySeconds] = useState(900);
  const [devEmailRecord, setDevEmailRecord] = useState<any | null>(null);
  const [showDevInspector, setShowDevInspector] = useState(false);

  // Form field states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [address, setAddress] = useState(user?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [medicalHistory, setMedicalHistory] = useState(user?.medicalHistory || '');

  // Doctor specific fields
  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');
  const [consultationFee, setConsultationFee] = useState(250);
  const [discountedFee, setDiscountedFee] = useState<number | ''>('');
  const [consultationDurationMinutes, setConsultationDurationMinutes] = useState(15);
  const [bio, setBio] = useState('');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email change cooldown timer
  useEffect(() => {
    if (emailChangeCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailChangeCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailChangeCooldown]);

  // Email change expiry timer
  useEffect(() => {
    if (!user?.pendingEmail || emailChangeExpirySeconds <= 0) return;
    const timer = setInterval(() => {
      setEmailChangeExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.pendingEmail, emailChangeExpirySeconds]);

  const fetchDevEmailChange = async (targetEmail: string) => {
    try {
      const res = await api.getRecentEmails();
      if (res.emails && res.emails.length > 0) {
        const found = res.emails.find(
          (m: any) =>
            m.to?.toLowerCase().includes(targetEmail.toLowerCase()) ||
            m.type === 'email_change_verification'
        );
        setDevEmailRecord(found || res.emails[0]);
      }
    } catch {
      // ignore
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!newEmailInput.trim()) {
      setStatusMessage({ type: 'error', text: 'New email address is required.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanNewEmail = newEmailInput.trim().toLowerCase();
    if (!emailRegex.test(cleanNewEmail)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (cleanNewEmail === user?.email.toLowerCase()) {
      setStatusMessage({ type: 'error', text: 'New email cannot be the same as your current active email.' });
      return;
    }
    if (!currentPasswordForEmail) {
      setStatusMessage({ type: 'error', text: 'Current password is required to authorize changing your email.' });
      return;
    }

    setIsRequestingEmailChange(true);
    try {
      const res = await api.requestEmailChange({
        newEmail: cleanNewEmail,
        currentPassword: currentPasswordForEmail,
      });
      await refreshUser();
      setEmailChangeOtp('');
      setCurrentPasswordForEmail('');
      setEmailChangeCooldown(60);
      setEmailChangeExpirySeconds(900);
      setStatusMessage({
        type: 'success',
        text: `Verification code sent to ${cleanNewEmail}. Please enter the 6-digit code below to confirm.`,
      });
      setTimeout(() => fetchDevEmailChange(cleanNewEmail), 500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to request email change.' });
      if (err.cooldownRemaining) {
        setEmailChangeCooldown(err.cooldownRemaining);
      }
    } finally {
      setIsRequestingEmailChange(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!emailChangeOtp.trim() || emailChangeOtp.trim().length !== 6) {
      setStatusMessage({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }

    setIsVerifyingEmailChange(true);
    try {
      const res = await api.verifyEmailChange({ otp: emailChangeOtp.trim() });
      await refreshUser();
      setEmailChangeOtp('');
      setNewEmailInput('');
      setStatusMessage({
        type: 'success',
        text: res.message || 'Email address successfully updated and verified!',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Invalid or expired verification code.' });
    } finally {
      setIsVerifyingEmailChange(false);
    }
  };

  const handleResendEmailChange = async () => {
    if (emailChangeCooldown > 0) return;
    setIsResendingEmailChange(true);
    setStatusMessage(null);
    try {
      const res = await api.resendEmailChange();
      setEmailChangeCooldown(res.cooldownSeconds || 60);
      setEmailChangeExpirySeconds(900);
      setStatusMessage({ type: 'success', text: res.message });
      if (user?.pendingEmail) {
        setTimeout(() => fetchDevEmailChange(user.pendingEmail!), 500);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to resend code.' });
      if (err.cooldownRemaining) {
        setEmailChangeCooldown(err.cooldownRemaining);
      }
    } finally {
      setIsResendingEmailChange(false);
    }
  };

  const handleCancelEmailChange = async () => {
    setIsCancellingEmailChange(true);
    setStatusMessage(null);
    try {
      const res = await api.cancelEmailChange();
      await refreshUser();
      setEmailChangeOtp('');
      setNewEmailInput('');
      setStatusMessage({
        type: 'success',
        text: res.message || 'Pending email change request cancelled. Your current email remains active and secure.',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to cancel email change.' });
    } finally {
      setIsCancellingEmailChange(false);
    }
  };

  const handleAutofillDevChangeCode = () => {
    if (devEmailRecord?.otp) {
      setEmailChangeOtp(devEmailRecord.otp);
    }
  };

  // Sync state when user changes
  useEffect(() => {
    resetToCurrentValues();
    if (isDoctor && user?.doctorId) {
      api.getDoctorById(user.doctorId).then((res) => {
        if (res.doctor) {
          setDoctorData(res.doctor);
          setQualifications(res.doctor.qualifications);
          setExperienceYears(res.doctor.experienceYears);
          setHospitalAffiliation(res.doctor.hospitalAffiliation);
          setConsultationFee(res.doctor.consultationFee);
          setDiscountedFee(res.doctor.discountedFee ?? '');
          setConsultationDurationMinutes(res.doctor.consultationDurationMinutes);
          setBio(res.doctor.bio);
        }
      });
    }
  }, [user, isDoctor]);

  const resetToCurrentValues = () => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setCustomAvatarUrl('');
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender || 'Male');
      setAddress(user.address || '');
      setEmergencyContact(user.emergencyContact || '');
      setMedicalHistory(user.medicalHistory || '');
    }
    if (doctorData) {
      setQualifications(doctorData.qualifications);
      setExperienceYears(doctorData.experienceYears);
      setHospitalAffiliation(doctorData.hospitalAffiliation);
      setConsultationFee(doctorData.consultationFee);
      setDiscountedFee(doctorData.discountedFee ?? '');
      setConsultationDurationMinutes(doctorData.consultationDurationMinutes);
      setBio(doctorData.bio);
    }
  };

  const handleCancelEdit = () => {
    resetToCurrentValues();
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Image file size must be under 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setAvatar(result);
        setCustomAvatarUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validation
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    if (name.trim().length < 2) {
      setStatusMessage({ type: 'error', text: 'Full name must be at least 2 characters.' });
      return;
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
        setStatusMessage({ type: 'error', text: 'Please enter a valid mobile number (8–15 digits).' });
        return;
      }
    }

    setIsSaving(true);

    try {
      const finalAvatar = customAvatarUrl.trim() || avatar;

      // 1. Update User Profile via backend
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatar: finalAvatar,
        dateOfBirth,
        gender,
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        medicalHistory: medicalHistory.trim(),
      });

      // 2. If Doctor, sync doctor profile
      if (isDoctor && user?.doctorId) {
        await api.updateDoctorProfile(user.doctorId, {
          qualifications,
          experienceYears: Number(experienceYears),
          hospitalAffiliation,
          consultationFee: Number(consultationFee),
          discountedFee: discountedFee === '' ? undefined : Number(discountedFee),
          consultationDurationMinutes: Number(consultationDurationMinutes),
          bio,
        });
      }

      await refreshUser();
      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'Profile changes saved and updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'Current password is required.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setStatusMessage({ type: 'error', text: 'New password must contain both letters and numbers.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsSaving(true);

    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({ type: 'success', text: 'Password successfully changed and verified!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
            QueueCare Account
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            My Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal patient records, contact information, and security settings.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              setActiveTab('profile');
              setStatusMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => {
              setActiveTab('email');
              setStatusMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Change Email</span>
            {user?.pendingEmail && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              setStatusMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Pending Email Change Security Alert Banner */}
      {user?.pendingEmail && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                <span>Email Change In Progress</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] uppercase font-bold">
                  Pending Verification
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed text-xs">
                A verification code was sent to <strong className="font-mono text-amber-950">{user.pendingEmail}</strong>. Your current active login remains <strong className="font-mono text-amber-950">{user.email}</strong> until the new email is verified.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setActiveTab('email')}
              className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Enter Code
            </button>
            <button
              onClick={handleCancelEmailChange}
              disabled={isCancellingEmailChange}
              className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-colors cursor-pointer"
            >
              {isCancellingEmailChange ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: PROFILE DETAILS */}
      {activeTab === 'profile' && (
        <>
          {/* VIEW MODE */}
          {!isEditing ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Top Profile Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80'}
                    alt={user?.name}
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-100 shadow-md shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-extrabold text-slate-900">{user?.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                        {user?.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user?.email}</span>
                      </div>
                      {user?.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsVerifyAccountModalOpen(true)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                          title="Click to enter verification code"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Unverified – Click to Verify
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab('email')}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline ml-1 cursor-pointer"
                      >
                        Change Email Address
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user?.phone || 'No mobile number recorded'}</span>
                    </p>
                  </div>
                </div>

                {/* Edit Profile Action Button */}
                <button
                  onClick={() => {
                    resetToCurrentValues();
                    setIsEditing(true);
                    setStatusMessage(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Personal Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Date of Birth
                  </span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>{user?.dateOfBirth || 'Not specified'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Gender
                  </span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-teal-600" />
                    <span>{user?.gender || 'Not specified'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Emergency Contact
                  </span>
                  <div className="font-bold text-slate-800 truncate">
                    {user?.emergencyContact || 'None listed'}
                  </div>
                </div>
              </div>

              {/* Residential Address */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  Residential Address
                </span>
                <p className="font-medium text-slate-800">
                  {user?.address || 'No residential address on file. Please click Edit Profile to add your address.'}
                </p>
              </div>

              {/* Medical Information */}
              {isPatient && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    Medical Notes & Allergies
                  </span>
                  <p className="text-slate-700">
                    {user?.medicalHistory || 'No medical conditions or drug allergies recorded.'}
                  </p>
                </div>
              )}

              {/* Doctor Practice Details */}
              {isDoctor && doctorData && (
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    Professional Clinical Credentials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Specialty</span>
                      <span className="font-bold text-slate-800">{doctorData.specialty}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Experience</span>
                      <span className="font-bold text-slate-800">{doctorData.experienceYears} Years</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Consultation Fee</span>
                      <span className="font-bold text-slate-800">₹{doctorData.consultationFee}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Edit Personal Information</h2>
                  <p className="text-xs text-slate-500">Update your contact details and patient records</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Cancel editing"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Photo Editor */}
              <div className="space-y-3 pb-6 border-b border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Update Profile Photo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0">
                    <img
                      src={customAvatarUrl || avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80'}
                      alt="Avatar"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-xs"
                    />
                    <label
                      htmlFor="profile-photo-upload"
                      className="absolute -bottom-2 -right-2 p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full cursor-pointer shadow-md transition-colors"
                      title="Upload photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        id="profile-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Choose an avatar preset or enter custom image URL:
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
                      placeholder="Or paste image URL: https://..."
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Permitted Personal Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Protected
                    </span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Name and contact phone"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, Postal Code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Medical Information */}
              {isPatient && (
                <div className="text-xs">
                  <label className="font-bold text-slate-700 block mb-1">
                    Relevant Medical Information & Known Allergies
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Asthmatic, allergic to penicillin, diabetes type 2..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                  />
                </div>
              )}

              {/* Save Changes and Cancel buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: CHANGE PASSWORD */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5 max-w-lg">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Change Account Password</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your current password and pick a strong new password with letters and numbers.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Current Password */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters (letters + numbers)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-3 pr-10 py-2.5 rounded-xl border outline-none ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                  Passwords do not match
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              {isSaving ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: CHANGE EMAIL ADDRESS */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                Security & Authentication
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                Change Email Address
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your registered QueueCare email address with password confirmation and cryptographic code verification.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Current active email:</span>
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                {user?.email}
              </span>
            </div>
          </div>

          {/* If there's an ongoing pending email change, show verification step */}
          {user?.pendingEmail ? (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Awaiting Email Verification</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  A 6-digit confirmation code was sent to <strong className="font-mono text-amber-950 font-bold">{user.pendingEmail}</strong>.
                  Your current email address (<strong className="font-mono text-amber-950">{user.email}</strong>) remains your active login until verified.
                </p>
                <div className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60 flex items-center gap-1 font-mono">
                  <span>Code expires in:</span>
                  <strong>{Math.floor(emailChangeExpirySeconds / 60)}m {emailChangeExpirySeconds % 60}s</strong>
                </div>
              </div>

              <form onSubmit={handleVerifyEmailChange} className="max-w-md space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailChangeOtp}
                    onChange={(e) => setEmailChangeOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    autoFocus
                    className="w-full text-center text-3xl font-extrabold tracking-[10px] font-mono py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-teal-500 focus:outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isVerifyingEmailChange || emailChangeOtp.length !== 6}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isVerifyingEmailChange ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & Activate New Email</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEmailChange}
                    disabled={isCancellingEmailChange}
                    className="py-3 px-4 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    {isCancellingEmailChange ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={handleResendEmailChange}
                    disabled={emailChangeCooldown > 0 || isResendingEmailChange}
                    className="font-bold text-teal-700 hover:text-teal-900 disabled:text-slate-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isResendingEmailChange ? 'animate-spin' : ''}`} />
                    <span>
                      {emailChangeCooldown > 0
                        ? `Resend code in ${emailChangeCooldown}s`
                        : 'Resend Verification Code'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Dev Testing Drawer for Email Change */}
              <div className="max-w-md rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-teal-700" />
                    Testing Helper / Code Inspector
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDevInspector(!showDevInspector)}
                    className="text-[11px] font-bold text-teal-700 underline cursor-pointer"
                  >
                    {showDevInspector ? 'Hide' : 'View Code'}
                  </button>
                </div>
                {devEmailRecord?.otp && (
                  <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-teal-700 block">Generated Code for New Email:</span>
                      <span className="font-mono text-base font-extrabold text-teal-950 tracking-wider">
                        {devEmailRecord.otp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutofillDevChangeCode}
                      className="px-3 py-1 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
                    >
                      Autofill Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Request New Email Form */
            <form onSubmit={handleRequestEmailChange} className="max-w-xl space-y-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  New Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your new email address (e.g. newname@example.com)"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  A 6-digit confirmation code will be sent to this email address to verify ownership.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Current Account Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswordForEmail ? 'text' : 'password'}
                    required
                    placeholder="Enter your current password to authorize this change"
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordForEmail(!showPasswordForEmail)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordForEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Policy Information Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  QueueCare Account Security Policy
                </span>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500">
                  <li>Your current email remains active and logged-in until the new email is verified.</li>
                  <li>We send a security notice to your current email address alerting you of this request.</li>
                  <li>If you did not initiate this change, you can immediately cancel it or contact support.</li>
                  <li>Verification links and OTPs expire after 15 minutes.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRequestingEmailChange}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isRequestingEmailChange ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Verification Code to New Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Account Verification Modal for Unverified Active Email */}
      <EmailVerificationModal
        isOpen={isVerifyAccountModalOpen}
        onClose={() => setIsVerifyAccountModalOpen(false)}
        email={user?.email || ''}
        mode="registration"
        onSuccess={() => {
          refreshUser();
          setStatusMessage({
            type: 'success',
            text: 'Your email address is now verified and your account is active!',
          });
        }}
      />
    </div>
  );
};
