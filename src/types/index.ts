export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  doctorId?: string;
  financialAssistanceApproved?: boolean;
  approvedDiscountPercent?: number;
  isEmailVerified: boolean;
  pendingEmail?: string;
  emailVerificationExpiresAt?: string;
  emailChangeExpiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export type SpecialtyName =
  | 'General Physician'
  | 'Cardiologist'
  | 'Dermatologist'
  | 'Neurologist'
  | 'Orthopedic Doctor'
  | 'Pediatrician'
  | 'Gynecologist'
  | 'ENT Specialist'
  | 'Ophthalmologist'
  | 'Dentist'
  | 'Psychiatrist'
  | 'Pulmonologist'
  | 'Gastroenterologist'
  | 'Endocrinologist'
  | 'Nephrologist'
  | 'Urologist'
  | 'Oncologist'
  | 'Physiotherapist';

export interface SpecialtyMeta {
  name: SpecialtyName;
  code: string;
  description: string;
  iconName: string;
  typicalFeeRange: string;
  doctorCount?: number;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  specialty: SpecialtyName;
  specialtyCode: string;
  qualifications: string;
  experienceYears: number;
  hospitalAffiliation: string;
  consultationFee: number;
  discountedFee?: number;
  offersFreeConsultation: boolean;
  consultationDurationMinutes: number;
  availableDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  isVerified: boolean;
  isActive: boolean;
  bio: string;
  rating: number;
  totalReviews: number;
}

export type SlotStatus = 'available' | 'booked';

export interface AppointmentSlot {
  time: string;
  status: SlotStatus;
  bookedByCurrentPatient?: boolean;
  appointmentId?: string;
}

export type AppointmentStatus = 'waiting' | 'in_consultation' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  specialty: SpecialtyName;
  hospitalAffiliation?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  queueToken: string; // e.g. CARD-001
  queueNumber: number;
  estimatedWaitMinutes: number;
  originalFee: number;
  discountAmount: number;
  finalFee: number;
  financialAssistanceApplied: boolean;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssistanceStatus = 'pending' | 'approved' | 'rejected';

export interface FinancialAssistanceRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  annualIncomeRange: string;
  reason: string;
  requestedSpecialty: string;
  status: AssistanceStatus;
  grantedDiscountPercent: number; // e.g. 50 or 100 for free
  adminRemarks?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  activeDoctors: number;
  totalAppointments: number;
  waitingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalAssistanceRequests: number;
  approvedAssistanceRequests: number;
  specialtyBreakdown: { specialty: string; count: number }[];
}
