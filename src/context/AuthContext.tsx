import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api, tokenStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  verifyEmail: (payload: { email?: string; otp?: string; token?: string }) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserInContext: (updatedUser: User) => void;
  loginAsDemo: (role: UserRole) => Promise<void>;
  isPatient: boolean;
  isDoctor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
    } catch (err: any) {
      console.warn('Failed to restore session:', err?.message);
      tokenStorage.remove();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      tokenStorage.set(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: any) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.register(formData);
      tokenStorage.set(res.token);
      setUser(res.user);
      return res;
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (payload: { email?: string; otp?: string; token?: string }) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.verifyEmail(payload);
      if (res.token) {
        tokenStorage.set(res.token);
      }
      setUser(res.user);
      return res;
    } catch (err: any) {
      setError(err?.message || 'Verification failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenStorage.remove();
    setUser(null);
  };

  const updateUserInContext = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const loginAsDemo = async (role: UserRole) => {
    let email = 'patient@queuecare.org';
    let password = 'Patient@123';
    if (role === 'doctor') {
      email = 'doctor@queuecare.org';
      password = 'Doctor@123';
    } else if (role === 'admin') {
      email = 'admin@queuecare.org';
      password = 'Admin@123';
    }
    await login(email, password);
  };

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        verifyEmail,
        logout,
        refreshUser,
        updateUserInContext,
        loginAsDemo,
        isPatient,
        isDoctor,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
