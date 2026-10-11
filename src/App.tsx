import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { api } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { DoctorDirectoryPage } from './pages/DoctorDirectoryPage.tsx';
import { DoctorProfilePage } from './pages/DoctorProfilePage.tsx';
import { PatientDashboard } from './pages/PatientDashboard.tsx';
import { DoctorDashboard } from './pages/DoctorDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { AffordableCarePage } from './pages/AffordableCarePage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { AppointmentModal } from './components/AppointmentModal.tsx';
import { FinancialAssistanceModal } from './components/FinancialAssistanceModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Doctor, Appointment } from './types/index.ts';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

function MainApp() {
  const { user, refreshUser, isPatient, isDoctor, isAdmin } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [navExtra, setNavExtra] = useState<any>({});
  const [urlVerificationToast, setUrlVerificationToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modals state
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [isFinancialAidOpen, setIsFinancialAidOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
  }>({ isOpen: false, mode: 'login' });

  // Handle URL verification token (e.g. from verification email link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('token');
    const verifyEmailParam = params.get('email');
    const mode = params.get('mode');

    if (verifyToken) {
      if (mode === 'email_change') {
        api
          .verifyEmailChange({ token: verifyToken })
          .then((res) => {
            setUrlVerificationToast({
              type: 'success',
              message: res.message || 'Email address successfully updated and verified!',
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            refreshUser();
            handleNavigate('profile', { tab: 'profile' });
          })
          .catch((err) => {
            setUrlVerificationToast({
              type: 'error',
              message: err.message || 'Verification link is invalid or has expired.',
            });
          });
      } else {
        api
          .verifyEmail({ token: verifyToken, email: verifyEmailParam || undefined })
          .then((res) => {
            setUrlVerificationToast({
              type: 'success',
              message: res.message || 'Email successfully verified! Your account is active.',
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            refreshUser();
            handleNavigate('patient-dashboard');
          })
          .catch((err) => {
            setUrlVerificationToast({
              type: 'error',
              message: err.message || 'Verification link is invalid or has expired.',
            });
          });
      }
    }
  }, []);

  const handleNavigate = (tab: string, extra?: any) => {
    setCurrentTab(tab);
    if (extra) {
      setNavExtra(extra);
    } else {
      setNavExtra({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    handleNavigate(mode);
  };

  const handleBookDoctor = (doctor: Doctor) => {
    setBookingDoctor(doctor);
  };

  const handleViewDoctorProfile = (doctor: Doctor) => {
    setViewingDoctor(doctor);
    setCurrentTab('doctor-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Universal Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Global URL Verification Alert Toast */}
      {urlVerificationToast && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-4">
          <div
            className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-200 ${
              urlVerificationToast.type === 'success'
                ? 'bg-emerald-500 text-white font-semibold'
                : 'bg-rose-500 text-white font-semibold'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {urlVerificationToast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{urlVerificationToast.message}</span>
            </div>
            <button
              onClick={() => setUrlVerificationToast(null)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onBookDoctor={handleBookDoctor}
            onViewDoctorProfile={handleViewDoctorProfile}
          />
        )}

        {currentTab === 'directory' && (
          <DoctorDirectoryPage
            initialSpecialty={navExtra.specialty || 'all'}
            initialSearch={navExtra.search || ''}
            initialOffersFree={Boolean(navExtra.offersFree)}
            onBookDoctor={handleBookDoctor}
            onViewDoctorProfile={handleViewDoctorProfile}
          />
        )}

        {currentTab === 'doctor-profile' && viewingDoctor && (
          <DoctorProfilePage
            doctor={viewingDoctor}
            onBack={() => handleNavigate('directory')}
            onViewExistingAppointment={() => {
              handleNavigate('patient-dashboard');
            }}
            onRequireLogin={() => handleNavigate('login')}
          />
        )}

        {currentTab === 'patient-dashboard' && (
          user ? (
            <PatientDashboard
              onNavigate={handleNavigate}
              onOpenFinancialAid={() => setIsFinancialAidOpen(true)}
            />
          ) : (
            <LoginPage
              onNavigateToRegister={() => handleNavigate('register')}
              onLoginSuccess={() => handleNavigate('patient-dashboard')}
            />
          )
        )}

        {currentTab === 'doctor-dashboard' && <DoctorDashboard />}

        {currentTab === 'admin' && <AdminDashboard />}

        {currentTab === 'affordable-care' && (
          <AffordableCarePage
            onNavigate={handleNavigate}
            onOpenFinancialAid={() => {
              if (!user) handleNavigate('login');
              else setIsFinancialAidOpen(true);
            }}
            onBookDoctor={handleBookDoctor}
            onViewDoctorProfile={handleViewDoctorProfile}
          />
        )}

        {currentTab === 'profile' && (
          user ? (
            <ProfilePage
              initialTab={navExtra.tab || 'profile'}
              initialIsEditing={Boolean(navExtra.edit)}
            />
          ) : (
            <LoginPage
              onNavigateToRegister={() => handleNavigate('register')}
              onLoginSuccess={() => handleNavigate('profile')}
            />
          )
        )}

        {currentTab === 'register' && (
          <RegisterPage
            onNavigateToLogin={() => handleNavigate('login')}
            onRegistrationSuccess={() => handleNavigate('patient-dashboard')}
          />
        )}

        {currentTab === 'login' && (
          <LoginPage
            onNavigateToRegister={() => handleNavigate('register')}
            onLoginSuccess={() => handleNavigate('patient-dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Booking Modal with Two-Colour Slot system and duplicate check */}
      {bookingDoctor && (
        <AppointmentModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onSuccess={(appointment) => {
            // Keep open until patient clicks Done, or redirect
          }}
          onViewExistingAppointment={(appointment) => {
            setBookingDoctor(null);
            handleNavigate('patient-dashboard');
          }}
          onRequireLogin={() => {
            setBookingDoctor(null);
            handleNavigate('login');
          }}
        />
      )}

      {/* Financial Aid Modal */}
      {isFinancialAidOpen && (
        <FinancialAssistanceModal
          onClose={() => setIsFinancialAidOpen(false)}
          onSuccess={() => {
            // Refreshes requests
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
