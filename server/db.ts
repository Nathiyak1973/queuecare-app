import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Doctor,
  Appointment,
  FinancialAssistanceRequest,
  AuditLog,
  SpecialtyMeta,
  SpecialtyName,
} from '../src/types/index.ts';
import { SPECIALTIES, STANDARD_SLOTS } from '../src/data/specialties.ts';

export { SPECIALTIES, STANDARD_SLOTS };

export interface UserRecord extends User {
  passwordHash: string;
  emailVerificationTokenHash?: string;
  emailVerificationOtpHash?: string;
  emailVerificationExpiresAt?: string;
  emailVerificationAttempts?: number;
  emailVerificationLastSentAt?: string;
  emailChangeTokenHash?: string;
  emailChangeOtpHash?: string;
  emailChangeExpiresAt?: string;
  emailChangeAttempts?: number;
  emailChangeLastSentAt?: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  doctors: Doctor[];
  appointments: Appointment[];
  financialAssistance: FinancialAssistanceRequest[];
  auditLogs: AuditLog[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    doctors: [],
    appointments: [],
    financialAssistance: [],
    auditLogs: [],
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure default seeded accounts have isEmailVerified = true
        for (const u of this.data.users) {
          if (['usr_admin', 'usr_patient_1', 'usr_doc_1'].includes(u.id)) {
            u.isEmailVerified = true;
          }
        }
        this.isLoaded = true;
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading DB, seeding fresh default state:', err);
      this.seedInitialData();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  private seedInitialData() {
    const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);
    const patientHash = bcrypt.hashSync('Patient@123', 10);
    const doctorHash = bcrypt.hashSync('Doctor@123', 10);
    const adminHash = bcrypt.hashSync('Admin@123', 10);

    // Initial Users
    const users: (User & { passwordHash: string })[] = [
      {
        id: 'usr_admin',
        name: 'Dr. Suresh Varma',
        email: 'admin@queuecare.org',
        passwordHash: adminHash,
        role: 'admin',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
        dateOfBirth: '1975-06-15',
        gender: 'Male',
        address: 'Administrative Wing, QueueCare Healthcare Network, New Delhi',
        emergencyContact: '+91 98765 43211',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_patient_1',
        name: 'Priya Sharma',
        email: 'patient@queuecare.org',
        passwordHash: patientHash,
        role: 'patient',
        phone: '+91 91234 56789',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
        dateOfBirth: '1996-04-12',
        gender: 'Female',
        address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
        emergencyContact: 'Rajesh Sharma (+91 91234 56780)',
        medicalHistory: 'Mild asthma in winter season; allergic to penicillin.',
        financialAssistanceApproved: true,
        approvedDiscountPercent: 50,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_doc_1',
        name: 'Dr. Aarav Sharma',
        email: 'doctor@queuecare.org',
        passwordHash: doctorHash,
        role: 'doctor',
        doctorId: 'doc_1',
        phone: '+91 99887 76655',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
        dateOfBirth: '1982-11-20',
        gender: 'Male',
        address: 'Heart Wellness Clinic, Koramangala 4th Block, Bengaluru',
        emergencyContact: '+91 99887 76600',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // Seed Doctors for ALL 18 Specialties
    const doctorsSeed: Omit<Doctor, 'id' | 'userId'>[] = [
      {
        name: 'Dr. Aarav Sharma',
        email: 'doctor@queuecare.org',
        phone: '+91 99887 76655',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
        specialty: 'Cardiologist',
        specialtyCode: 'CARD',
        qualifications: 'MBBS, MD (Cardiology), FACC',
        experienceYears: 14,
        hospitalAffiliation: 'QueueCare Metro Heart Institute',
        consultationFee: 300,
        discountedFee: 200,
        offersFreeConsultation: true,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Senior consultant cardiologist dedicated to preventive cardiology, hypertension control, and affordable community cardiac checkups.',
        rating: 4.9,
        totalReviews: 128,
      },
      {
        name: 'Dr. Meera Nambiar',
        email: 'meera.nambiar@queuecare.org',
        phone: '+91 98450 11223',
        avatar: 'https://images.unsplash.com/photo-1594824813637-bf45934f828a?w=300&auto=format&fit=crop&q=80',
        specialty: 'General Physician',
        specialtyCode: 'GEN',
        qualifications: 'MBBS, MD (General Medicine)',
        experienceYears: 11,
        hospitalAffiliation: 'QueueCare Community Health Centre',
        consultationFee: 150,
        discountedFee: 100,
        offersFreeConsultation: true,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Compassionate general physician with comprehensive expertise in primary care, fever diagnosis, diabetes screening, and geriatric health.',
        rating: 4.8,
        totalReviews: 240,
      },
      {
        name: 'Dr. Rohan Deshmukh',
        email: 'rohan.deshmukh@queuecare.org',
        phone: '+91 97654 33211',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
        specialty: 'Dermatologist',
        specialtyCode: 'DERM',
        qualifications: 'MBBS, DVD, MD (Dermatology)',
        experienceYears: 9,
        hospitalAffiliation: 'Skin & Allergy Care Clinic',
        consultationFee: 250,
        discountedFee: 180,
        offersFreeConsultation: false,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Specialist in clinical dermatology, contact dermatitis, psoriasis management, and pediatric skin allergies.',
        rating: 4.7,
        totalReviews: 95,
      },
      {
        name: 'Dr. Sunita Rao',
        email: 'sunita.rao@queuecare.org',
        phone: '+91 96541 22334',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
        specialty: 'Gynecologist',
        specialtyCode: 'OBGYN',
        qualifications: 'MBBS, MS (OB-GYN), DGO',
        experienceYears: 16,
        hospitalAffiliation: 'Maternal & Women Health Wing',
        consultationFee: 280,
        discountedFee: 200,
        offersFreeConsultation: true,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Expert in high-risk obstetrics, menstrual health, prenatal care, PCOS management, and adolescent gynaecology.',
        rating: 4.9,
        totalReviews: 210,
      },
      {
        name: 'Dr. Ananya Roy',
        email: 'ananya.roy@queuecare.org',
        phone: '+91 95432 11998',
        avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&auto=format&fit=crop&q=80',
        specialty: 'Pediatrician',
        specialtyCode: 'PED',
        qualifications: 'MBBS, DCH, MD (Pediatrics)',
        experienceYears: 10,
        hospitalAffiliation: 'QueueCare Child Development Care',
        consultationFee: 180,
        discountedFee: 120,
        offersFreeConsultation: true,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Gentle and dedicated pediatrician handling newborn vaccinations, seasonal infections, and developmental milestones.',
        rating: 4.9,
        totalReviews: 180,
      },
      {
        name: 'Dr. Vikramaditya Kulkarni',
        email: 'vikram.kulkarni@queuecare.org',
        phone: '+91 94321 00876',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
        specialty: 'Neurologist',
        specialtyCode: 'NEUR',
        qualifications: 'MBBS, MD, DM (Neurology)',
        experienceYears: 15,
        hospitalAffiliation: 'Advanced Brain & Spine Research Center',
        consultationFee: 350,
        discountedFee: 250,
        offersFreeConsultation: false,
        consultationDurationMinutes: 20,
        availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Specialist in headache disorders, epilepsy, neuropathy, and post-stroke neuromuscular recovery.',
        rating: 4.8,
        totalReviews: 112,
      },
      {
        name: 'Dr. Rajesh Patel',
        email: 'rajesh.patel@queuecare.org',
        phone: '+91 93210 99765',
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
        specialty: 'Orthopedic Doctor',
        specialtyCode: 'ORTH',
        qualifications: 'MBBS, MS (Orthopedics), MCh',
        experienceYears: 13,
        hospitalAffiliation: 'Bone & Joint Reconstruction Hospital',
        consultationFee: 280,
        discountedFee: 200,
        offersFreeConsultation: true,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Expertise in knee and hip joint preservation, arthritis pain relief, fracture management, and sports trauma.',
        rating: 4.8,
        totalReviews: 145,
      },
      {
        name: 'Dr. Farhan Qureshi',
        email: 'farhan.qureshi@queuecare.org',
        phone: '+91 92109 88654',
        avatar: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80',
        specialty: 'ENT Specialist',
        specialtyCode: 'ENT',
        qualifications: 'MBBS, MS (ENT), DLO',
        experienceYears: 8,
        hospitalAffiliation: 'Metropolitan Ear, Nose & Throat Clinic',
        consultationFee: 180,
        discountedFee: 120,
        offersFreeConsultation: false,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Wednesday', 'Thursday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Diagnostic specialist for chronic sinusitis, allergic rhinitis, hearing loss screenings, and vertigo.',
        rating: 4.7,
        totalReviews: 89,
      },
      {
        name: 'Dr. Kavita Singhania',
        email: 'kavita.singhania@queuecare.org',
        phone: '+91 91098 77543',
        avatar: 'https://images.unsplash.com/photo-1594824813637-bf45934f828a?w=300&auto=format&fit=crop&q=80',
        specialty: 'Ophthalmologist',
        specialtyCode: 'OPHT',
        qualifications: 'MBBS, MS (Ophthalmology)',
        experienceYears: 12,
        hospitalAffiliation: 'Community Vision Care Center',
        consultationFee: 180,
        discountedFee: 100,
        offersFreeConsultation: true,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Providing affordable diabetic retinopathy screening, refractive error assessments, and dry eye care.',
        rating: 4.8,
        totalReviews: 130,
      },
      {
        name: 'Dr. Neeraj Chopra',
        email: 'neeraj.chopra@queuecare.org',
        phone: '+91 90987 66432',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
        specialty: 'Dentist',
        specialtyCode: 'DENT',
        qualifications: 'BDS, MDS (Conservative Dentistry)',
        experienceYears: 7,
        hospitalAffiliation: 'QueueCare Dental Smile Studio',
        consultationFee: 150,
        discountedFee: 100,
        offersFreeConsultation: true,
        consultationDurationMinutes: 20,
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Preventive dental wellness, painless dental restoration, gum health, and affordable oral hygiene guidance.',
        rating: 4.9,
        totalReviews: 160,
      },
      {
        name: 'Dr. Shalini Menon',
        email: 'shalini.menon@queuecare.org',
        phone: '+91 89876 55321',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
        specialty: 'Psychiatrist',
        specialtyCode: 'PSYC',
        qualifications: 'MBBS, MD (Psychiatry), DPM',
        experienceYears: 11,
        hospitalAffiliation: 'Mind & Wellness Counseling Unit',
        consultationFee: 300,
        discountedFee: 180,
        offersFreeConsultation: true,
        consultationDurationMinutes: 25,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Confidential psychiatric evaluations, stress relief therapy, sleep restoration, and depression support.',
        rating: 4.9,
        totalReviews: 92,
      },
      {
        name: 'Dr. Arvind Bansal',
        email: 'arvind.bansal@queuecare.org',
        phone: '+91 88765 44210',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
        specialty: 'Pulmonologist',
        specialtyCode: 'PULM',
        qualifications: 'MBBS, DTCD, DNB (Respiratory Diseases)',
        experienceYears: 13,
        hospitalAffiliation: 'Chest & Allergy Research Centre',
        consultationFee: 250,
        discountedFee: 180,
        offersFreeConsultation: false,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Specialist in COPD, persistent allergic bronchitis, asthma action plans, and post-viral lung recovery.',
        rating: 4.7,
        totalReviews: 87,
      },
      {
        name: 'Dr. Preeti Ganguly',
        email: 'preeti.ganguly@queuecare.org',
        phone: '+91 87654 33109',
        avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&auto=format&fit=crop&q=80',
        specialty: 'Gastroenterologist',
        specialtyCode: 'GAST',
        qualifications: 'MBBS, MD, DM (Gastroenterology)',
        experienceYears: 14,
        hospitalAffiliation: 'Digestive Health & Endoscopy Unit',
        consultationFee: 300,
        discountedFee: 220,
        offersFreeConsultation: false,
        consultationDurationMinutes: 15,
        availableDays: ['Tuesday', 'Wednesday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Comprehensive care for fatty liver, acidity, peptic ulcers, IBS, and chronic gastrointestinal discomfort.',
        rating: 4.8,
        totalReviews: 104,
      },
      {
        name: 'Dr. Harish Bhatt',
        email: 'harish.bhatt@queuecare.org',
        phone: '+91 86543 22098',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
        specialty: 'Endocrinologist',
        specialtyCode: 'ENDO',
        qualifications: 'MBBS, MD, DM (Endocrinology)',
        experienceYears: 12,
        hospitalAffiliation: 'Metabolic & Thyroid Wellness Center',
        consultationFee: 280,
        discountedFee: 200,
        offersFreeConsultation: true,
        consultationDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Specialist in affordable diabetes management, thyroid nodule monitoring, and obesity-related hormonal imbalance.',
        rating: 4.8,
        totalReviews: 119,
      },
      {
        name: 'Dr. Madhavan Nair',
        email: 'madhavan.nair@queuecare.org',
        phone: '+91 85432 11987',
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
        specialty: 'Nephrologist',
        specialtyCode: 'NEPH',
        qualifications: 'MBBS, MD, DM (Nephrology)',
        experienceYears: 16,
        hospitalAffiliation: 'Renal Care & Dialysis Institute',
        consultationFee: 320,
        discountedFee: 220,
        offersFreeConsultation: false,
        consultationDurationMinutes: 20,
        availableDays: ['Monday', 'Wednesday', 'Thursday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Preventive kidney wellness, chronic kidney disease staging, proteinuria control, and electrolyte balance.',
        rating: 4.9,
        totalReviews: 78,
      },
      {
        name: 'Dr. Tarun Saxena',
        email: 'tarun.saxena@queuecare.org',
        phone: '+91 84321 00876',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
        specialty: 'Urologist',
        specialtyCode: 'UROL',
        qualifications: 'MBBS, MS, MCh (Urology)',
        experienceYears: 10,
        hospitalAffiliation: 'QueueCare Kidney Stone & Urology Clinic',
        consultationFee: 280,
        discountedFee: 200,
        offersFreeConsultation: false,
        consultationDurationMinutes: 15,
        availableDays: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Medical and surgical therapy for kidney stones, prostate enlargement, and urinary tract health.',
        rating: 4.7,
        totalReviews: 83,
      },
      {
        name: 'Dr. Radhika Iyer',
        email: 'radhika.iyer@queuecare.org',
        phone: '+91 83210 99765',
        avatar: 'https://images.unsplash.com/photo-1594824813637-bf45934f828a?w=300&auto=format&fit=crop&q=80',
        specialty: 'Oncologist',
        specialtyCode: 'ONC',
        qualifications: 'MBBS, MD, DM (Medical Oncology)',
        experienceYears: 15,
        hospitalAffiliation: 'Hope Community Cancer Support Wing',
        consultationFee: 350,
        discountedFee: 250,
        offersFreeConsultation: true,
        consultationDurationMinutes: 25,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Dedicated to affordable second opinions, cancer awareness, tumor screening, and palliative compassionate guidance.',
        rating: 5.0,
        totalReviews: 142,
      },
      {
        name: 'Dr. Manish Verma',
        email: 'manish.verma@queuecare.org',
        phone: '+91 82109 88654',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
        specialty: 'Physiotherapist',
        specialtyCode: 'PHYS',
        qualifications: 'BPT, MPT (Musculoskeletal & Sports)',
        experienceYears: 8,
        hospitalAffiliation: 'ActiveLife Physical Rehabilitation Wing',
        consultationFee: 150,
        discountedFee: 100,
        offersFreeConsultation: true,
        consultationDurationMinutes: 20,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '09:00 AM', end: '05:00 PM' },
        isVerified: true,
        isActive: true,
        bio: 'Postural correction, cervical spondylosis exercises, back pain recovery, and post-fracture joint mobilization.',
        rating: 4.9,
        totalReviews: 175,
      },
    ];

    const doctors: Doctor[] = doctorsSeed.map((doc, idx) => {
      const docId = idx === 0 ? 'doc_1' : `doc_${idx + 1}`;
      const userId = idx === 0 ? 'usr_doc_1' : `usr_doc_${idx + 1}`;

      // Create user entry for doctor if not already present
      if (idx > 0) {
        users.push({
          id: userId,
          name: doc.name,
          email: doc.email,
          passwordHash: defaultPasswordHash,
          role: 'doctor',
          doctorId: docId,
          phone: doc.phone,
          avatar: doc.avatar,
          dateOfBirth: '1985-05-15',
          gender: idx % 2 === 0 ? 'Female' : 'Male',
          address: doc.hospitalAffiliation,
          isEmailVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        id: docId,
        userId: userId,
        ...doc,
      };
    });

    // Today's and Tomorrow's dates formatted YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    // Seed realistic Appointments
    const appointments: Appointment[] = [
      {
        id: 'apt_seed_1',
        patientId: 'usr_patient_1',
        patientName: 'Priya Sharma',
        patientPhone: '+91 91234 56789',
        patientEmail: 'patient@queuecare.org',
        doctorId: 'doc_1',
        doctorName: 'Dr. Aarav Sharma',
        doctorAvatar: doctors[0].avatar,
        specialty: 'Cardiologist',
        hospitalAffiliation: doctors[0].hospitalAffiliation,
        date: today,
        timeSlot: '09:30 AM',
        queueToken: 'CARD-001',
        queueNumber: 1,
        estimatedWaitMinutes: 15,
        originalFee: 300,
        discountAmount: 150,
        finalFee: 150,
        financialAssistanceApplied: true,
        status: 'waiting',
        notes: 'Routine blood pressure review and resting ECG evaluation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt_seed_2',
        patientId: 'usr_patient_demo_2',
        patientName: 'Kunal Kapoor',
        patientPhone: '+91 98888 11111',
        patientEmail: 'kunal.kapoor@example.com',
        doctorId: 'doc_1',
        doctorName: 'Dr. Aarav Sharma',
        doctorAvatar: doctors[0].avatar,
        specialty: 'Cardiologist',
        hospitalAffiliation: doctors[0].hospitalAffiliation,
        date: today,
        timeSlot: '10:00 AM',
        queueToken: 'CARD-002',
        queueNumber: 2,
        estimatedWaitMinutes: 30,
        originalFee: 300,
        discountAmount: 0,
        finalFee: 300,
        financialAssistanceApplied: false,
        status: 'waiting',
        notes: 'Mild chest heaviness following brisk walks',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Financial Assistance Seed
    const financialAssistance: FinancialAssistanceRequest[] = [
      {
        id: 'fa_1',
        patientId: 'usr_patient_1',
        patientName: 'Priya Sharma',
        patientEmail: 'patient@queuecare.org',
        patientPhone: '+91 91234 56789',
        annualIncomeRange: 'Under ₹1,50,000 / year',
        reason: 'Single breadwinner supporting elderly parents requiring regular cardiology checkups and blood work.',
        requestedSpecialty: 'Cardiologist',
        status: 'approved',
        grantedDiscountPercent: 50,
        adminRemarks: 'Verified BPL healthcare entitlement card. Approved 50% discount on all consultations.',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'fa_2',
        patientId: 'usr_patient_demo_3',
        patientName: 'Rameshwar Yadav',
        patientEmail: 'rameshwar.yadav@example.com',
        patientPhone: '+91 97766 55443',
        annualIncomeRange: 'Under ₹1,00,000 / year',
        reason: 'Daily wage construction laborer with persistent knee inflammation preventing daily work.',
        requestedSpecialty: 'Orthopedic Doctor',
        status: 'pending',
        grantedDiscountPercent: 0,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'log_1',
        action: 'SYSTEM_INITIALIZED',
        performedBy: 'System',
        performedByRole: 'admin',
        target: 'QueueCare Core',
        details: 'Initial system bootstrap with 18 medical specialties and verified practitioners.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'log_2',
        action: 'FINANCIAL_ASSISTANCE_APPROVED',
        performedBy: 'Dr. Suresh Varma (Admin)',
        performedByRole: 'admin',
        target: 'Priya Sharma (usr_patient_1)',
        details: 'Approved 50% healthcare concession following document review.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    this.data = {
      users,
      doctors,
      appointments,
      financialAssistance,
      auditLogs,
    };
  }

  // Safe sanitization stripping secrets
  private sanitizeUser(u: UserRecord): User {
    const {
      passwordHash,
      emailVerificationTokenHash,
      emailVerificationOtpHash,
      emailChangeTokenHash,
      emailChangeOtpHash,
      emailVerificationAttempts,
      emailChangeAttempts,
      emailVerificationLastSentAt,
      emailChangeLastSentAt,
      ...rest
    } = u;
    return {
      ...rest,
      isEmailVerified: Boolean(rest.isEmailVerified),
    };
  }

  // Users
  getUsers(): User[] {
    return this.data.users.map((u) => this.sanitizeUser(u));
  }

  getUserById(id: string): User | undefined {
    const found = this.data.users.find((u) => u.id === id);
    if (!found) return undefined;
    return this.sanitizeUser(found);
  }

  getUserRecordById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmailWithPassword(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserRecordByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserRecordByPendingEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.pendingEmail && u.pendingEmail.toLowerCase() === email.toLowerCase());
  }

  getUserRecordByVerificationTokenHash(hash: string): UserRecord | undefined {
    return this.data.users.find((u) => u.emailVerificationTokenHash === hash);
  }

  getUserRecordByEmailChangeTokenHash(hash: string): UserRecord | undefined {
    return this.data.users.find((u) => u.emailChangeTokenHash === hash);
  }

  createUser(user: UserRecord): User {
    this.data.users.push(user);
    this.save();
    return this.sanitizeUser(user);
  }

  updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const current = this.data.users[idx];
    this.data.users[idx] = {
      ...current,
      ...updates,
      // Protect sensitive fields from unprivileged modification
      id: current.id,
      role: updates.role ?? current.role,
      passwordHash: current.passwordHash,
    };
    this.save();
    return this.sanitizeUser(this.data.users[idx]);
  }

  updateUserRecord(id: string, updates: Partial<UserRecord>): UserRecord | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      id,
    };
    this.save();
    return this.data.users[idx];
  }

  updateUserPassword(id: string, newPasswordHash: string) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users[idx].passwordHash = newPasswordHash;
    this.save();
    return true;
  }

  // Doctors
  getDoctors(filters?: {
    specialty?: string;
    search?: string;
    availability?: string;
    maxFee?: number;
    minExperience?: number;
    offersFree?: boolean;
    includeUnverified?: boolean;
  }): Doctor[] {
    let list = this.data.doctors;
    if (!filters?.includeUnverified) {
      list = list.filter((d) => d.isVerified && d.isActive);
    }

    if (filters?.specialty && filters.specialty !== 'all') {
      list = list.filter(
        (d) => d.specialty.toLowerCase() === filters.specialty!.toLowerCase()
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.hospitalAffiliation.toLowerCase().includes(q) ||
          d.qualifications.toLowerCase().includes(q)
      );
    }

    if (filters?.offersFree) {
      list = list.filter((d) => d.offersFreeConsultation || d.consultationFee === 0);
    }

    if (filters?.maxFee !== undefined && !isNaN(filters.maxFee)) {
      list = list.filter((d) => (d.discountedFee ?? d.consultationFee) <= filters.maxFee!);
    }

    if (filters?.minExperience !== undefined && !isNaN(filters.minExperience)) {
      list = list.filter((d) => d.experienceYears >= filters.minExperience!);
    }

    return list;
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.data.doctors.find((d) => d.id === id);
  }

  getDoctorByUserId(userId: string): Doctor | undefined {
    return this.data.doctors.find((d) => d.userId === userId);
  }

  createDoctor(doctor: Doctor) {
    this.data.doctors.push(doctor);
    this.save();
    return doctor;
  }

  updateDoctor(id: string, updates: Partial<Doctor>) {
    const idx = this.data.doctors.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.doctors[idx] = {
      ...this.data.doctors[idx],
      ...updates,
      id,
    };
    this.save();
    return this.data.doctors[idx];
  }

  // Appointments
  getAppointments(): Appointment[] {
    return this.data.appointments;
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.data.appointments.find((a) => a.id === id);
  }

  getAppointmentsByPatient(patientId: string): Appointment[] {
    return this.data.appointments.filter((a) => a.patientId === patientId);
  }

  getAppointmentsByDoctor(doctorId: string, date?: string): Appointment[] {
    return this.data.appointments.filter((a) => {
      if (a.doctorId !== doctorId) return false;
      if (date && a.date !== date) return false;
      return true;
    });
  }

  findActiveAppointmentForPatientAndDoctor(patientId: string, doctorId: string, date: string): Appointment | undefined {
    return this.data.appointments.find(
      (a) =>
        a.patientId === patientId &&
        a.doctorId === doctorId &&
        a.date === date &&
        a.status !== 'cancelled'
    );
  }

  isSlotBooked(doctorId: string, date: string, timeSlot: string): boolean {
    return this.data.appointments.some(
      (a) =>
        a.doctorId === doctorId &&
        a.date === date &&
        a.timeSlot === timeSlot &&
        a.status !== 'cancelled'
    );
  }

  createAppointment(appointment: Appointment): Appointment {
    this.data.appointments.push(appointment);
    this.save();
    return appointment;
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const idx = this.data.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.appointments[idx] = {
      ...this.data.appointments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.appointments[idx];
  }

  // Generate readable unique token like OBGYN-001, CARD-002
  generateQueueToken(specialtyCode: string, doctorId: string, date: string): { token: string; number: number } {
    const existingForDoctorToday = this.data.appointments.filter(
      (a) => a.doctorId === doctorId && a.date === date
    );
    const count = existingForDoctorToday.length + 1;
    const formattedNum = String(count).padStart(3, '0');
    const token = `${specialtyCode.toUpperCase()}-${formattedNum}`;
    return { token, number: count };
  }

  // Financial Assistance
  getFinancialAssistanceRequests(patientId?: string): FinancialAssistanceRequest[] {
    if (patientId) {
      return this.data.financialAssistance.filter((fa) => fa.patientId === patientId);
    }
    return this.data.financialAssistance;
  }

  createFinancialAssistanceRequest(req: FinancialAssistanceRequest): FinancialAssistanceRequest {
    this.data.financialAssistance.push(req);
    this.save();
    return req;
  }

  updateFinancialAssistanceRequest(id: string, updates: Partial<FinancialAssistanceRequest>): FinancialAssistanceRequest | null {
    const idx = this.data.financialAssistance.findIndex((fa) => fa.id === id);
    if (idx === -1) return null;
    this.data.financialAssistance[idx] = {
      ...this.data.financialAssistance[idx],
      ...updates,
    };
    this.save();
    return this.data.financialAssistance[idx];
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const entry: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.save();
    return entry;
  }
}

export const db = new DatabaseService();
