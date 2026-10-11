import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth.ts';
import { FinancialAssistanceRequest } from '../../src/types/index.ts';

const router = Router();

// Get patient's own financial assistance applications
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const patientId = req.user!.id;
  const requests = db.getFinancialAssistanceRequests(patientId);
  res.json({ requests });
});

// Submit a new financial assistance request
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const patient = req.user!;
    const { annualIncomeRange, reason, requestedSpecialty } = req.body;

    if (!annualIncomeRange || !reason) {
      res.status(400).json({ error: 'Income range and reason for assistance are required.' });
      return;
    }

    const newRequest: FinancialAssistanceRequest = {
      id: `fa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone || '',
      annualIncomeRange,
      reason: reason.trim(),
      requestedSpecialty: requestedSpecialty || 'All Specialties',
      status: 'pending',
      grantedDiscountPercent: 0,
      createdAt: new Date().toISOString(),
    };

    const saved = db.createFinancialAssistanceRequest(newRequest);

    db.addAuditLog({
      action: 'FINANCIAL_ASSISTANCE_SUBMITTED',
      performedBy: patient.name,
      performedByRole: patient.role,
      target: newRequest.id,
      details: `Submitted assistance request (${annualIncomeRange})`,
    });

    res.status(201).json({ request: saved, message: 'Application submitted successfully for administrative review.' });
  } catch (err: any) {
    console.error('Financial assistance submit error:', err);
    res.status(500).json({ error: 'Failed to submit financial assistance request.' });
  }
});

// Admin views all requests
router.get('/admin', authenticate, authorizeRoles('admin'), (_req: AuthRequest, res: Response): void => {
  const requests = db.getFinancialAssistanceRequests();
  // Sort pending first, then by date desc
  requests.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json({ requests, total: requests.length });
});

// Admin reviews and approves/rejects
router.put('/:id/review', authenticate, authorizeRoles('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, grantedDiscountPercent, adminRemarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be approved or rejected.' });
      return;
    }

    const discount = status === 'approved' ? Number(grantedDiscountPercent || 50) : 0;

    const updated = db.updateFinancialAssistanceRequest(id, {
      status,
      grantedDiscountPercent: discount,
      adminRemarks: adminRemarks || '',
      reviewedAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ error: 'Financial assistance request not found.' });
      return;
    }

    // If approved, update the patient's user profile with the discount entitlement
    if (status === 'approved') {
      db.updateUser(updated.patientId, {
        financialAssistanceApproved: true,
        approvedDiscountPercent: discount,
      });
    }

    db.addAuditLog({
      action: `FINANCIAL_ASSISTANCE_${status.toUpperCase()}`,
      performedBy: req.user!.name,
      performedByRole: 'admin',
      target: updated.patientName,
      details: `${status === 'approved' ? `Approved ${discount}% concession` : 'Rejected application'}: ${adminRemarks || 'No remarks'}`,
    });

    res.json({ request: updated, message: `Application ${status} successfully.` });
  } catch (err: any) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to review request.' });
  }
});

export default router;
