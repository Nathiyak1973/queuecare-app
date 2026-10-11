import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth.ts';
import { Appointment, AppointmentStatus } from '../../src/types/index.ts';

const router = Router();

// Book an appointment
router.post('/book', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const patientId = req.user!.id;
    const { doctorId, date, timeSlot, notes } = req.body;

    if (!doctorId || !date || !timeSlot) {
      res.status(400).json({ error: 'Doctor, date, and time slot are required for booking.' });
      return;
    }

    const doctor = db.getDoctorById(doctorId);
    if (!doctor || !doctor.isActive) {
      res.status(404).json({ error: 'Selected doctor is not available for appointments.' });
      return;
    }

    // 0. EMAIL VERIFICATION CHECK: Prevent unverified patients from booking appointments
    const currentUserRecord = db.getUserById(patientId);
    if (!currentUserRecord?.isEmailVerified) {
      res.status(403).json({
        conflictType: 'EMAIL_NOT_VERIFIED',
        error: 'Email verification required. Please verify your email address to book appointments.',
        requiresVerification: true,
      });
      return;
    }

    // 1. DUPLICATE CHECK: Patient cannot book multiple active appointments with the same doctor on the same date
    const existingActiveAppointment = db.findActiveAppointmentForPatientAndDoctor(
      patientId,
      doctorId,
      date
    );

    if (existingActiveAppointment) {
      res.status(409).json({
        conflictType: 'EXISTING_APPOINTMENT_SAME_DOCTOR_DATE',
        error: `You already have an active appointment with this doctor on ${date} (Token: ${existingActiveAppointment.queueToken}).`,
        message: 'You already have an appointment with this doctor. Please view your existing appointment or choose another available slot.',
        existingAppointment: existingActiveAppointment,
      });
      return;
    }

    // 2. SLOT AVAILABILITY CHECK: Prevent two patients from booking the same slot
    if (db.isSlotBooked(doctorId, date, timeSlot)) {
      res.status(409).json({
        conflictType: 'SLOT_ALREADY_BOOKED',
        error: 'This appointment slot has just been booked by another patient. Please choose an available green slot.',
      });
      return;
    }

    // 3. Queue Token Generation
    const { token, number } = db.generateQueueToken(doctor.specialtyCode, doctor.id, date);

    // 4. Calculate estimated wait time based on queue position and consultation duration
    const consultationDuration = doctor.consultationDurationMinutes || 15;
    const estimatedWaitMinutes = Math.max(0, (number - 1) * consultationDuration);

    // 5. Affordable Care / Fee Calculation
    const originalFee = doctor.consultationFee;
    let discountAmount = 0;
    let finalFee = originalFee;
    let financialAssistanceApplied = false;

    // Check doctor discounted fee first
    if (doctor.discountedFee !== undefined && doctor.discountedFee < originalFee) {
      discountAmount = originalFee - doctor.discountedFee;
      finalFee = doctor.discountedFee;
    }

    // Check user's approved financial assistance (can offer deeper concession up to 100% free)
    if (req.user!.financialAssistanceApproved && req.user!.approvedDiscountPercent) {
      const concessionPct = req.user!.approvedDiscountPercent;
      const concessionAmount = Math.round((originalFee * concessionPct) / 100);
      if (concessionAmount > discountAmount) {
        discountAmount = concessionAmount;
        finalFee = Math.max(0, originalFee - concessionAmount);
        financialAssistanceApplied = true;
      }
    }

    // Check if doctor offers free consultation
    if (doctor.offersFreeConsultation && originalFee === 0) {
      discountAmount = originalFee;
      finalFee = 0;
    }

    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newAppointment: Appointment = {
      id: appointmentId,
      patientId,
      patientName: req.user!.name,
      patientPhone: req.user!.phone || '',
      patientEmail: req.user!.email,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorAvatar: doctor.avatar,
      specialty: doctor.specialty,
      hospitalAffiliation: doctor.hospitalAffiliation,
      date,
      timeSlot,
      queueToken: token,
      queueNumber: number,
      estimatedWaitMinutes,
      originalFee,
      discountAmount,
      finalFee,
      financialAssistanceApplied,
      status: 'waiting',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.createAppointment(newAppointment);

    db.addAuditLog({
      action: 'APPOINTMENT_BOOKED',
      performedBy: req.user!.name,
      performedByRole: req.user!.role,
      target: doctor.name,
      details: `Booked token ${token} for ${date} at ${timeSlot} (Payable: ₹${finalFee})`,
    });

    res.status(201).json({
      message: 'Appointment confirmed successfully!',
      appointment: saved,
    });
  } catch (err: any) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to process appointment booking.' });
  }
});

// Patient's appointments
router.get('/my', authenticate, (req: AuthRequest, res: Response): void => {
  const patientId = req.user!.id;
  const list = db.getAppointmentsByPatient(patientId);
  // Sort descending by created date
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ appointments: list });
});

// Doctor's appointments and queue view
router.get('/doctor/:doctorId', authenticate, (req: AuthRequest, res: Response): void => {
  const { doctorId } = req.params;
  const date = (req.query.date as string) || undefined;

  // Authorization: doctor can view own, admin can view any
  const isDoctorSelf = req.user?.role === 'doctor' && req.user.doctorId === doctorId;
  const isAdmin = req.user?.role === 'admin';

  if (!isDoctorSelf && !isAdmin) {
    res.status(403).json({ error: 'You are not authorized to view this doctor queue.' });
    return;
  }

  const list = db.getAppointmentsByDoctor(doctorId, date);
  // Sort by timeSlot / queueNumber
  list.sort((a, b) => a.queueNumber - b.queueNumber);

  res.json({ appointments: list, count: list.length });
});

// Cancel appointment
router.put('/:id/cancel', authenticate, (req: AuthRequest, res: Response): void => {
  const appointment = db.getAppointmentById(req.params.id);
  if (!appointment) {
    res.status(404).json({ error: 'Appointment not found.' });
    return;
  }

  const isPatientSelf = appointment.patientId === req.user!.id;
  const isDoctorSelf = req.user?.role === 'doctor' && req.user.doctorId === appointment.doctorId;
  const isAdmin = req.user?.role === 'admin';

  if (!isPatientSelf && !isDoctorSelf && !isAdmin) {
    res.status(403).json({ error: 'Unauthorized to cancel this appointment.' });
    return;
  }

  if (appointment.status === 'completed') {
    res.status(400).json({ error: 'Cannot cancel an appointment that has already been completed.' });
    return;
  }

  const updated = db.updateAppointment(appointment.id, {
    status: 'cancelled',
  });

  db.addAuditLog({
    action: 'APPOINTMENT_CANCELLED',
    performedBy: req.user!.name,
    performedByRole: req.user!.role,
    target: appointment.queueToken,
    details: `Cancelled appointment on ${appointment.date} with ${appointment.doctorName}. Slot released to available.`,
  });

  res.json({
    message: 'Appointment successfully cancelled. The slot has been released back to available.',
    appointment: updated,
  });
});

// Update appointment queue status (Waiting -> In Consultation -> Completed)
router.put('/:id/status', authenticate, (req: AuthRequest, res: Response): void => {
  const appointment = db.getAppointmentById(req.params.id);
  if (!appointment) {
    res.status(404).json({ error: 'Appointment not found.' });
    return;
  }

  const isDoctorSelf = req.user?.role === 'doctor' && req.user.doctorId === appointment.doctorId;
  const isAdmin = req.user?.role === 'admin';

  if (!isDoctorSelf && !isAdmin) {
    res.status(403).json({ error: 'Only the consulting doctor or administrator can update queue status.' });
    return;
  }

  const { status } = req.body as { status: AppointmentStatus };
  const validStatuses: AppointmentStatus[] = ['waiting', 'in_consultation', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const updated = db.updateAppointment(appointment.id, { status });

  db.addAuditLog({
    action: 'QUEUE_STATUS_UPDATED',
    performedBy: req.user!.name,
    performedByRole: req.user!.role,
    target: appointment.queueToken,
    details: `Status transitioned to '${status}'`,
  });

  res.json({ appointment: updated });
});

// Admin list of all appointments
router.get('/all', authenticate, authorizeRoles('admin'), (req: AuthRequest, res: Response): void => {
  const appointments = db.getAppointments();
  appointments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ appointments, total: appointments.length });
});

export default router;
