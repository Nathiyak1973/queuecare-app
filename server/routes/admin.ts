import { Router, Response } from 'express';
import { db, SPECIALTIES } from '../db.ts';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth.ts';
import { AdminStats } from '../../src/types/index.ts';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

// Admin Dashboard aggregated stats
router.get('/stats', (_req: AuthRequest, res: Response): void => {
  const users = db.getUsers();
  const doctors = db.getDoctors({ includeUnverified: true });
  const appointments = db.getAppointments();
  const assistance = db.getFinancialAssistanceRequests();

  const patients = users.filter((u) => u.role === 'patient');
  const activeDoctors = doctors.filter((d) => d.isActive && d.isVerified);

  const waitingAppointments = appointments.filter((a) => a.status === 'waiting' || a.status === 'in_consultation').length;
  const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
  const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled').length;

  const approvedAssistance = assistance.filter((fa) => fa.status === 'approved').length;

  const specialtyBreakdown = SPECIALTIES.map((spec) => {
    const count = doctors.filter((d) => d.specialty.toLowerCase() === spec.name.toLowerCase()).length;
    return { specialty: spec.name, count };
  });

  const stats: AdminStats = {
    totalPatients: patients.length,
    totalDoctors: doctors.length,
    activeDoctors: activeDoctors.length,
    totalAppointments: appointments.length,
    waitingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalAssistanceRequests: assistance.length,
    approvedAssistanceRequests: approvedAssistance,
    specialtyBreakdown,
  };

  res.json({ stats });
});

// Manage users list
router.get('/users', (_req: AuthRequest, res: Response): void => {
  const users = db.getUsers();
  res.json({ users });
});

// Toggle user activation
router.put('/users/:id/status', (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (id === req.user!.id) {
    res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    return;
  }

  const updated = db.updateUser(id, { isActive: Boolean(isActive) });
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  db.addAuditLog({
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    performedBy: req.user!.name,
    performedByRole: 'admin',
    target: updated.email,
    details: `Account status updated to ${isActive ? 'Active' : 'Inactive'}`,
  });

  res.json({ user: updated });
});

// Audit logs
router.get('/audit-logs', (_req: AuthRequest, res: Response): void => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

export default router;
