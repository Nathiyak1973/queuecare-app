import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, SPECIALTIES, STANDARD_SLOTS } from '../db.ts';
import { authenticate, optionalAuth, authorizeRoles, AuthRequest } from '../middleware/auth.ts';
import { Doctor, SpecialtyName, AppointmentSlot } from '../../src/types/index.ts';

const router = Router();

// Get list of all specialties with metadata and doctor counts
router.get('/specialties', (_req, res) => {
  const allDoctors = db.getDoctors();
  const list = SPECIALTIES.map((spec) => {
    const count = allDoctors.filter(
      (d) => d.specialty.toLowerCase() === spec.name.toLowerCase() && d.isActive && d.isVerified
    ).length;
    return {
      ...spec,
      doctorCount: count,
    };
  });
  res.json({ specialties: list });
});

// List doctors with search and filter
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const {
    specialty,
    search,
    maxFee,
    minExperience,
    offersFree,
    includeUnverified,
  } = req.query;

  const isAdmin = req.user?.role === 'admin';

  const doctors = db.getDoctors({
    specialty: specialty as string,
    search: search as string,
    maxFee: maxFee ? Number(maxFee) : undefined,
    minExperience: minExperience ? Number(minExperience) : undefined,
    offersFree: offersFree === 'true',
    includeUnverified: isAdmin && includeUnverified === 'true',
  });

  res.json({ doctors, total: doctors.length });
});

// Get single doctor details
router.get('/:id', (req, res) => {
  const doctor = db.getDoctorById(req.params.id);
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found.' });
    return;
  }
  res.json({ doctor });
});

// Get doctor's slots for a specific date
// Strictly returns two-colour status: 'available' (Green) or 'booked' (Red)
router.get('/:id/slots', optionalAuth, (req: AuthRequest, res: Response): void => {
  const doctor = db.getDoctorById(req.params.id);
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found.' });
    return;
  }

  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const patientId = req.user?.id;

  // Check if current patient already has an active booking with this doctor on this date
  let existingAppointment = null;
  if (patientId) {
    existingAppointment = db.findActiveAppointmentForPatientAndDoctor(patientId, doctor.id, date);
  }

  // Build slot list: strictly 'available' or 'booked'
  const slots: AppointmentSlot[] = STANDARD_SLOTS.map((time) => {
    const isBooked = db.isSlotBooked(doctor.id, date, time);
    const isCurrentPatientSlot =
      Boolean(existingAppointment && existingAppointment.timeSlot === time);

    return {
      time,
      status: isBooked ? 'booked' : 'available',
      bookedByCurrentPatient: isCurrentPatientSlot,
      appointmentId: isCurrentPatientSlot ? existingAppointment?.id : undefined,
    };
  });

  res.json({
    date,
    doctorId: doctor.id,
    doctorName: doctor.name,
    hasActiveAppointment: Boolean(existingAppointment),
    existingAppointment: existingAppointment || null,
    slots,
  });
});

// Doctor updates their own profile
router.put('/:id/profile', authenticate, (req: AuthRequest, res: Response): void => {
  const doctor = db.getDoctorById(req.params.id);
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found.' });
    return;
  }

  const isSelf = req.user?.role === 'doctor' && req.user.doctorId === doctor.id;
  const isAdmin = req.user?.role === 'admin';

  if (!isSelf && !isAdmin) {
    res.status(403).json({ error: 'You are not authorized to edit this doctor profile.' });
    return;
  }

  const {
    qualifications,
    experienceYears,
    hospitalAffiliation,
    consultationFee,
    discountedFee,
    offersFreeConsultation,
    consultationDurationMinutes,
    availableDays,
    workingHours,
    bio,
  } = req.body;

  const updates: Partial<Doctor> = {};
  if (qualifications !== undefined) updates.qualifications = qualifications;
  if (experienceYears !== undefined) updates.experienceYears = Number(experienceYears);
  if (hospitalAffiliation !== undefined) updates.hospitalAffiliation = hospitalAffiliation;
  if (consultationFee !== undefined) updates.consultationFee = Number(consultationFee);
  if (discountedFee !== undefined) updates.discountedFee = discountedFee === null ? undefined : Number(discountedFee);
  if (offersFreeConsultation !== undefined) updates.offersFreeConsultation = Boolean(offersFreeConsultation);
  if (consultationDurationMinutes !== undefined) updates.consultationDurationMinutes = Number(consultationDurationMinutes);
  if (availableDays !== undefined) updates.availableDays = availableDays;
  if (workingHours !== undefined) updates.workingHours = workingHours;
  if (bio !== undefined) updates.bio = bio;

  const updated = db.updateDoctor(doctor.id, updates);

  db.addAuditLog({
    action: 'DOCTOR_PROFILE_UPDATED',
    performedBy: req.user!.name,
    performedByRole: req.user!.role,
    target: doctor.name,
    details: `Updated professional credentials and fee settings`,
  });

  res.json({ doctor: updated });
});

// Admin creates and registers a new doctor
router.post('/', authenticate, authorizeRoles('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password = 'Doctor@123',
      specialty,
      qualifications,
      experienceYears = 5,
      hospitalAffiliation,
      consultationFee = 250,
      discountedFee,
      offersFreeConsultation = false,
      availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      bio = 'Dedicated specialist committed to delivering exceptional patient care.',
      avatar,
    } = req.body;

    if (!name || !email || !specialty) {
      res.status(400).json({ error: 'Name, email, and specialty are required to register a doctor.' });
      return;
    }

    const existingUser = db.getUserByEmailWithPassword(email);
    if (existingUser) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const matchedSpec = SPECIALTIES.find(
      (s) => s.name.toLowerCase() === specialty.toLowerCase()
    );
    const specCode = matchedSpec ? matchedSpec.code : 'SPEC';

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const newDoctor: Doctor = {
      id: docId,
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '+91 98000 00000',
      avatar:
        avatar ||
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
      specialty: matchedSpec ? matchedSpec.name : (specialty as SpecialtyName),
      specialtyCode: specCode,
      qualifications: qualifications || 'MBBS, MD',
      experienceYears: Number(experienceYears),
      hospitalAffiliation: hospitalAffiliation || 'QueueCare Medical Wing',
      consultationFee: Number(consultationFee),
      discountedFee: discountedFee ? Number(discountedFee) : undefined,
      offersFreeConsultation: Boolean(offersFreeConsultation),
      consultationDurationMinutes: 15,
      availableDays,
      workingHours: { start: '09:00 AM', end: '05:00 PM' },
      isVerified: true,
      isActive: true,
      bio,
      rating: 5.0,
      totalReviews: 1,
    };

    db.createUser({
      id: userId,
      name: newDoctor.name,
      email: newDoctor.email,
      passwordHash,
      role: 'doctor',
      doctorId: docId,
      phone: newDoctor.phone,
      avatar: newDoctor.avatar,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    db.createDoctor(newDoctor);

    db.addAuditLog({
      action: 'DOCTOR_REGISTERED_BY_ADMIN',
      performedBy: req.user!.name,
      performedByRole: 'admin',
      target: newDoctor.name,
      details: `Registered as ${newDoctor.specialty} with fee ₹${newDoctor.consultationFee}`,
    });

    res.status(201).json({ doctor: newDoctor });
  } catch (err: any) {
    console.error('Doctor registration error:', err);
    res.status(500).json({ error: 'Failed to register doctor.' });
  }
});

// Admin toggles doctor verification/active status
router.put('/:id/verify', authenticate, authorizeRoles('admin'), (req: AuthRequest, res: Response): void => {
  const doctor = db.getDoctorById(req.params.id);
  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found.' });
    return;
  }

  const { isVerified, isActive } = req.body;
  const updates: Partial<Doctor> = {};
  if (isVerified !== undefined) updates.isVerified = Boolean(isVerified);
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  const updated = db.updateDoctor(doctor.id, updates);

  db.addAuditLog({
    action: 'DOCTOR_STATUS_CHANGED',
    performedBy: req.user!.name,
    performedByRole: 'admin',
    target: doctor.name,
    details: `Status updated: Verified=${updates.isVerified ?? doctor.isVerified}, Active=${updates.isActive ?? doctor.isActive}`,
  });

  res.json({ doctor: updated });
});

export default router;
