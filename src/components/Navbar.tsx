import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  User as UserIcon,
  Calendar,
  ShieldCheck,
  Stethoscope,
  LogOut,
  ChevronDown,
  Menu,
  X,
  HeartHandshake,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenAuth }) => {
  const { user, logout, loginAsDemo, isPatient, isDoctor, isAdmin } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    if (isAdmin) onNavigate('admin');
    else if (isDoctor) onNavigate('doctor-dashboard');
    else if (isPatient) onNavigate('patient-dashboard');
    else onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Test-Role Quick Switcher Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">Interactive Role Switcher:</span>
            <span className="text-slate-400 hidden sm:inline">Test all 3 roles instantly with pre-seeded demo accounts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                loginAsDemo('patient');
                onNavigate('patient-dashboard');
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isPatient
                  ? 'bg-teal-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Patient: Priya
            </button>
            <button
              onClick={() => {
                loginAsDemo('doctor');
                onNavigate('doctor-dashboard');
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isDoctor
                  ? 'bg-sky-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Doctor: Dr. Aarav
            </button>
            <button
              onClick={() => {
                loginAsDemo('admin');
                onNavigate('admin');
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isAdmin
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Admin: Dr. Suresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Official Clickable QueueCare Logo (Compact) */}
          <div className="flex items-center">
            <Logo
              variant="compact"
              onClick={handleLogoClick}
              showTagline={true}
              className="py-1"
            />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'home'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onNavigate('directory')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'directory'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Find Doctors
            </button>

            <button
              onClick={() => onNavigate('affordable-care')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'affordable-care'
                  ? 'text-teal-700 bg-teal-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-teal-600" />
              Affordable Care
            </button>

            {/* Role-Specific Direct Navigation */}
            {isPatient && (
              <button
                onClick={() => onNavigate('patient-dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'patient-dashboard'
                    ? 'text-teal-700 bg-teal-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-teal-600" />
                My Queue & Bookings
              </button>
            )}

            {isDoctor && (
              <button
                onClick={() => onNavigate('doctor-dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'doctor-dashboard'
                    ? 'text-sky-700 bg-sky-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-sky-600" />
                Doctor Console
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'admin'
                    ? 'text-amber-800 bg-amber-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Admin Dashboard
              </button>
            )}
          </nav>

          {/* Right Section: User Profile or Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-expanded={profileDropdownOpen}
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                  />
                  <div className="text-left hidden lg:block pr-1">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] uppercase font-medium tracking-wider text-teal-700 capitalize">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {user.role} Account
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate('profile');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        My Profile Details
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate('profile', { tab: 'password' });
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-slate-500" />
                        Change Password
                      </button>

                      {isPatient && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('patient-dashboard');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-teal-600" />
                          Appointments & Token Queue
                        </button>
                      )}

                      {isDoctor && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('doctor-dashboard');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Stethoscope className="w-4 h-4 text-sky-600" />
                          Doctor Consultations & Slots
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onNavigate('admin');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          Full Admin Management
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          onNavigate('home');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 rounded-lg shadow-xs hover:shadow-sm transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('directory');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Find Doctors
          </button>
          <button
            onClick={() => {
              onNavigate('affordable-care');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Affordable Care
          </button>

          {isPatient && (
            <button
              onClick={() => {
                onNavigate('patient-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              My Appointments & Queue
            </button>
          )}

          {isDoctor && (
            <button
              onClick={() => {
                onNavigate('doctor-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              Doctor Queue & Slots
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              Admin Dashboard
            </button>
          )}

          {user && (
            <button
              onClick={() => {
                onNavigate('profile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              My Profile
            </button>
          )}

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  onNavigate('home');
                }}
                className="w-full py-2 text-center text-sm font-semibold text-rose-600 bg-rose-50 rounded-lg"
              >
                Sign Out ({user.name})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="py-2 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="py-2 text-center text-sm font-semibold text-white bg-teal-600 rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
