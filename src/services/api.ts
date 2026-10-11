import {
  User,
  Doctor,
  Appointment,
  FinancialAssistanceRequest,
  SpecialtyMeta,
  AdminStats,
  AuditLog,
  AppointmentSlot,
} from '../types/index.ts';

const TOKEN_KEY = 'queuecare_auth_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.conflictType = data.conflictType;
    error.existingAppointment = data.existingAppointment;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) =>
    request<{ user: User; token: string; message: string; verificationDetails?: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (payload: { email?: string; otp?: string; token?: string }) =>
    request<{ message: string; user: User; token: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendVerification: (email: string) =>
    request<{ message: string; expiresAt?: string; cooldownSeconds?: number }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getRecentEmails: () =>
    request<{ emails: any[] }>('/api/auth/recent-emails'),

  login: (payload: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: User }>('/api/users/me'),

  getUserProfile: () => request<{ user: User }>('/api/users/me'),

  updateProfile: (payload: Partial<User>) =>
    request<{ user: User; message?: string }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Email Change
  requestEmailChange: (payload: { newEmail: string; currentPassword: string }) =>
    request<{ message: string; pendingEmail: string; expiresAt: string; user: User }>('/api/users/change-email/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmailChange: (payload: { otp?: string; token?: string }) =>
    request<{ message: string; user: User; token: string }>('/api/users/change-email/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendEmailChange: () =>
    request<{ message: string; expiresAt: string; cooldownSeconds: number }>('/api/users/change-email/resend', {
      method: 'POST',
    }),

  cancelEmailChange: () =>
    request<{ message: string; user: User }>('/api/users/change-email/cancel', {
      method: 'POST',
    }),

  // Doctors
  getSpecialties: () =>
    request<{ specialties: SpecialtyMeta[] }>('/api/doctors/specialties'),

  getDoctors: (params: {
    specialty?: string;
    search?: string;
    maxFee?: number;
    minExperience?: number;
    offersFree?: boolean;
    includeUnverified?: boolean;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.specialty && params.specialty !== 'all') query.set('specialty', params.specialty);
    if (params.search) query.set('search', params.search);
    if (params.maxFee) query.set('maxFee', String(params.maxFee));
    if (params.minExperience) query.set('minExperience', String(params.minExperience));
    if (params.offersFree) query.set('offersFree', 'true');
    if (params.includeUnverified) query.set('includeUnverified', 'true');

    return request<{ doctors: Doctor[]; total: number }>(`/api/doctors?${query.toString()}`);
  },

  getDoctorById: (id: string) =>
    request<{ doctor: Doctor }>(`/api/doctors/${id}`),

  getDoctorSlots: (id: string, date: string) =>
    request<{
      date: string;
      doctorId: string;
      doctorName: string;
      hasActiveAppointment: boolean;
      existingAppointment: Appointment | null;
      slots: AppointmentSlot[];
    }>(`/api/doctors/${id}/slots?date=${date}`),

  updateDoctorProfile: (id: string, payload: Partial<Doctor>) =>
    request<{ doctor: Doctor }>(`/api/doctors/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createDoctor: (payload: any) =>
    request<{ doctor: Doctor }>('/api/doctors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleDoctorVerification: (id: string, payload: { isVerified?: boolean; isActive?: boolean }) =>
    request<{ doctor: Doctor }>(`/api/doctors/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Appointments
  bookAppointment: (payload: {
    doctorId: string;
    date: string;
    timeSlot: string;
    notes?: string;
  }) =>
    request<{ message: string; appointment: Appointment }>('/api/appointments/book', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyAppointments: () =>
    request<{ appointments: Appointment[] }>('/api/appointments/my'),

  getDoctorAppointments: (doctorId: string, date?: string) =>
    request<{ appointments: Appointment[]; count: number }>(
      `/api/appointments/doctor/${doctorId}${date ? `?date=${date}` : ''}`
    ),

  cancelAppointment: (id: string) =>
    request<{ message: string; appointment: Appointment }>(
      `/api/appointments/${id}/cancel`,
      { method: 'PUT' }
    ),

  updateAppointmentStatus: (id: string, status: string) =>
    request<{ appointment: Appointment }>(`/api/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getAllAppointments: () =>
    request<{ appointments: Appointment[]; total: number }>(
      '/api/appointments/all'
    ),

  // Financial Assistance
  getMyFinancialRequests: () =>
    request<{ requests: FinancialAssistanceRequest[] }>(
      '/api/financial-assistance'
    ),

  submitFinancialRequest: (payload: {
    annualIncomeRange: string;
    reason: string;
    requestedSpecialty: string;
  }) =>
    request<{ request: FinancialAssistanceRequest; message: string }>(
      '/api/financial-assistance',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getAdminFinancialRequests: () =>
    request<{ requests: FinancialAssistanceRequest[]; total: number }>(
      '/api/financial-assistance/admin'
    ),

  reviewFinancialRequest: (
    id: string,
    payload: {
      status: 'approved' | 'rejected';
      grantedDiscountPercent?: number;
      adminRemarks?: string;
    }
  ) =>
    request<{ request: FinancialAssistanceRequest; message: string }>(
      `/api/financial-assistance/${id}/review`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    ),

  // Admin
  getAdminStats: () => request<{ stats: AdminStats }>('/api/admin/stats'),

  getAllUsers: () => request<{ users: User[] }>('/api/admin/users'),

  toggleUserStatus: (id: string, isActive: boolean) =>
    request<{ user: User }>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  getAuditLogs: () => request<{ logs: AuditLog[] }>('/api/admin/audit-logs'),
};
