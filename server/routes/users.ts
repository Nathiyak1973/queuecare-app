import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth.ts';
import { User } from '../../src/types/index.ts';
import {
  emailService,
  generateVerificationSecrets,
  hashToken,
} from '../services/email.ts';

const router = Router();

// GET /api/users/me - Get current logged-in user profile
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const current = db.getUserById(req.user!.id);
  res.json({ user: current || req.user });
});

// PUT /api/users/me - Update current user's profile details
router.put('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      phone,
      avatar,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      medicalHistory,
    } = req.body;

    // Field validation
    if (name !== undefined && name.trim().length < 2) {
      res.status(400).json({ error: 'Name must be at least 2 characters.' });
      return;
    }

    if (phone !== undefined && phone.trim() !== '') {
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        res.status(400).json({ error: 'Please enter a valid mobile number (8–15 digits).' });
        return;
      }
    }

    const updates: Partial<User> = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updates.gender = gender;
    if (address !== undefined) updates.address = address.trim();
    if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact.trim();
    if (medicalHistory !== undefined) updates.medicalHistory = medicalHistory.trim();

    // Security: ordinary users CANNOT alter their role, email, or id directly here
    const updatedUser = db.updateUser(userId, updates);

    // If user is a doctor, sync relevant fields
    if (req.user!.role === 'doctor' && req.user!.doctorId) {
      db.updateDoctor(req.user!.doctorId, {
        name: updates.name,
        phone: updates.phone,
        avatar: updates.avatar,
      });
    }

    db.addAuditLog({
      action: 'USER_PROFILE_UPDATED',
      performedBy: req.user!.name,
      performedByRole: req.user!.role,
      target: req.user!.email,
      details: 'Profile details updated via /api/users/me',
    });

    res.json({ user: updatedUser, message: 'Profile details updated successfully.' });
  } catch (err: any) {
    console.error('Update /api/users/me error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/users/change-email/request - Initiate secure email change
router.post('/change-email/request', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !newEmail.trim()) {
      res.status(400).json({ error: 'New email address is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanNewEmail = newEmail.trim().toLowerCase();
    if (!emailRegex.test(cleanNewEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const userRecord = db.getUserRecordById(req.user!.id);
    if (!userRecord) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    // Check if new email is identical to current email
    if (cleanNewEmail === userRecord.email.toLowerCase()) {
      res.status(400).json({ error: 'The new email address cannot be the same as your current email.' });
      return;
    }

    // Require current password for security authorization
    if (!currentPassword) {
      res.status(400).json({ error: 'Current password is required to authorize changing your email address.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, userRecord.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Incorrect current password. Authorization failed.' });
      return;
    }

    // Check if new email is already in use by another user
    const existingActiveUser = db.getUserRecordByEmail(cleanNewEmail);
    if (existingActiveUser && existingActiveUser.id !== userRecord.id) {
      res.status(409).json({ error: 'This email address is already registered by another account.' });
      return;
    }

    // Check if new email is pending on another account
    const existingPendingUser = db.getUserRecordByPendingEmail(cleanNewEmail);
    if (existingPendingUser && existingPendingUser.id !== userRecord.id) {
      res.status(409).json({ error: 'This email address has an active pending verification on another account.' });
      return;
    }

    // Rate limiting & cooldown check (60 seconds)
    if (userRecord.emailChangeLastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(userRecord.emailChangeLastSentAt).getTime()) / 1000);
      const COOLDOWN_SECONDS = 60;
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        res.status(429).json({
          error: `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before requesting another email verification code.`,
          cooldownRemaining: remaining,
        });
        return;
      }
    }

    // Generate cryptographic secrets
    const { otp, token: verifyToken, otpHash, tokenHash } = generateVerificationSecrets();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    // Save pending change state WITHOUT altering current active email
    db.updateUserRecord(userRecord.id, {
      pendingEmail: cleanNewEmail,
      emailChangeOtpHash: otpHash,
      emailChangeTokenHash: tokenHash,
      emailChangeExpiresAt: expiry,
      emailChangeAttempts: 0,
      emailChangeLastSentAt: new Date().toISOString(),
    });

    // 1. Send verification link and OTP to NEW email address
    try {
      await emailService.sendEmailChangeVerificationEmail(
        cleanNewEmail,
        userRecord.name,
        otp,
        verifyToken
      );
    } catch (e) {
      console.error('Failed to send verification email to new address:', e);
    }

    // 2. Notify OLD email address that a change has been requested (no sensitive info)
    try {
      await emailService.sendEmailChangeAlertToOldEmail(
        userRecord.email,
        cleanNewEmail,
        userRecord.name
      );
    } catch (e) {
      console.error('Failed to send security alert to old email:', e);
    }

    db.addAuditLog({
      action: 'EMAIL_CHANGE_REQUESTED',
      performedBy: userRecord.name,
      performedByRole: userRecord.role,
      target: `${userRecord.email} -> ${cleanNewEmail}`,
      details: 'Email change requested. Verification code sent to new address and security alert sent to old address.',
    });

    const updatedUser = db.getUserById(userRecord.id)!;

    res.json({
      message: `A verification code has been sent to ${cleanNewEmail}. Please enter the code within 15 minutes to complete the change.`,
      pendingEmail: cleanNewEmail,
      expiresAt: expiry,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('Email change request error:', err);
    res.status(500).json({ error: 'Failed to request email change.' });
  }
});

// POST /api/users/change-email/verify - Verify and apply new email address
router.post('/change-email/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { otp, token } = req.body;

    if (!otp && !token) {
      res.status(400).json({ error: 'Verification code (OTP) or link token is required.' });
      return;
    }

    const userRecord = db.getUserRecordById(req.user!.id);
    if (!userRecord) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (!userRecord.pendingEmail) {
      res.status(400).json({ error: 'No email change request is currently pending for this account.' });
      return;
    }

    // Expiry check (15 mins)
    if (!userRecord.emailChangeExpiresAt || new Date() > new Date(userRecord.emailChangeExpiresAt)) {
      res.status(400).json({
        error: 'Verification code for email change has expired. Please initiate a new change request.',
        isExpired: true,
      });
      return;
    }

    // Rate limiting attempts (max 5)
    const currentAttempts = userRecord.emailChangeAttempts || 0;
    if (currentAttempts >= 5) {
      // Invalidate pending change for safety
      db.updateUserRecord(userRecord.id, {
        pendingEmail: undefined,
        emailChangeOtpHash: undefined,
        emailChangeTokenHash: undefined,
        emailChangeExpiresAt: undefined,
        emailChangeAttempts: 0,
      });
      res.status(429).json({
        error: 'Too many incorrect attempts. For your security, this email change request has been cancelled.',
        cancelled: true,
      });
      return;
    }

    let isValid = false;
    if (otp && userRecord.emailChangeOtpHash) {
      isValid = hashToken(otp) === userRecord.emailChangeOtpHash;
    } else if (token && userRecord.emailChangeTokenHash) {
      isValid = hashToken(token) === userRecord.emailChangeTokenHash;
    }

    if (!isValid) {
      const newAttempts = currentAttempts + 1;
      db.updateUserRecord(userRecord.id, {
        emailChangeAttempts: newAttempts,
      });
      const remaining = Math.max(0, 5 - newAttempts);
      res.status(400).json({
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        remainingAttempts: remaining,
      });
      return;
    }

    // Success! Update email address, mark verified, and invalidate pending secrets
    const oldEmail = userRecord.email;
    const newEmail = userRecord.pendingEmail;

    db.updateUserRecord(userRecord.id, {
      email: newEmail,
      isEmailVerified: true,
      pendingEmail: undefined,
      emailChangeOtpHash: undefined,
      emailChangeTokenHash: undefined,
      emailChangeExpiresAt: undefined,
      emailChangeAttempts: 0,
      emailChangeLastSentAt: undefined,
    });

    // If user is doctor, sync doctor profile email
    if (userRecord.role === 'doctor' && userRecord.doctorId) {
      db.updateDoctor(userRecord.doctorId, { email: newEmail });
    }

    // Send confirmation to BOTH old and new addresses
    try {
      await emailService.sendEmailChangeCompletedNotification(oldEmail, newEmail, userRecord.name);
    } catch (e) {
      console.error('Failed to dispatch change completion notifications:', e);
    }

    const updatedUser = db.getUserById(userRecord.id)!;

    db.addAuditLog({
      action: 'EMAIL_CHANGED_COMPLETED',
      performedBy: updatedUser.name,
      performedByRole: updatedUser.role,
      target: `${oldEmail} -> ${newEmail}`,
      details: 'Email successfully verified and updated. Old verification tokens invalidated.',
    });

    // Generate fresh JWT token with the new email
    const newToken = generateToken(updatedUser);

    res.json({
      message: `Your account email address has been successfully updated to ${newEmail}!`,
      user: updatedUser,
      token: newToken,
    });
  } catch (err: any) {
    console.error('Email change verification error:', err);
    res.status(500).json({ error: 'Failed to verify new email address.' });
  }
});

// POST /api/users/change-email/resend - Resend verification code to pending new email
router.post('/change-email/resend', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRecord = db.getUserRecordById(req.user!.id);
    if (!userRecord || !userRecord.pendingEmail) {
      res.status(400).json({ error: 'No email change request is currently pending.' });
      return;
    }

    // Cooldown check (60 seconds)
    if (userRecord.emailChangeLastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(userRecord.emailChangeLastSentAt).getTime()) / 1000);
      const COOLDOWN_SECONDS = 60;
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        res.status(429).json({
          error: `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before requesting another code.`,
          cooldownRemaining: remaining,
        });
        return;
      }
    }

    // Generate fresh secrets
    const { otp, token: verifyToken, otpHash, tokenHash } = generateVerificationSecrets();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.updateUserRecord(userRecord.id, {
      emailChangeOtpHash: otpHash,
      emailChangeTokenHash: tokenHash,
      emailChangeExpiresAt: expiry,
      emailChangeAttempts: 0,
      emailChangeLastSentAt: new Date().toISOString(),
    });

    await emailService.sendEmailChangeVerificationEmail(
      userRecord.pendingEmail,
      userRecord.name,
      otp,
      verifyToken
    );

    res.json({
      message: `A fresh verification code has been sent to ${userRecord.pendingEmail}.`,
      expiresAt: expiry,
      cooldownSeconds: 60,
    });
  } catch (err: any) {
    console.error('Resend email change error:', err);
    res.status(500).json({ error: 'Failed to resend code.' });
  }
});

// POST /api/users/change-email/cancel - Cancel pending email change request
router.post('/change-email/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRecord = db.getUserRecordById(req.user!.id);
    if (!userRecord) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    db.updateUserRecord(userRecord.id, {
      pendingEmail: undefined,
      emailChangeOtpHash: undefined,
      emailChangeTokenHash: undefined,
      emailChangeExpiresAt: undefined,
      emailChangeAttempts: 0,
      emailChangeLastSentAt: undefined,
    });

    db.addAuditLog({
      action: 'EMAIL_CHANGE_CANCELLED',
      performedBy: userRecord.name,
      performedByRole: userRecord.role,
      target: userRecord.email,
      details: 'Pending email change cancelled. Current email secured.',
    });

    const updatedUser = db.getUserById(userRecord.id)!;

    res.json({
      message: 'Pending email change request cancelled. Your current email remains safe and active.',
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('Cancel email change error:', err);
    res.status(500).json({ error: 'Failed to cancel email change.' });
  }
});

// PUT /api/users/change-password - Change current user's password
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Both current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    // Password strength check
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      res.status(400).json({ error: 'New password must contain both letters and numbers.' });
      return;
    }

    const userWithHash = db.getUserByEmailWithPassword(req.user!.email);
    if (!userWithHash) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect. Please check and try again.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.updateUserPassword(req.user!.id, newHash);

    db.addAuditLog({
      action: 'PASSWORD_CHANGED',
      performedBy: req.user!.name,
      performedByRole: req.user!.role,
      target: req.user!.email,
      details: 'Password securely changed via /api/users/change-password',
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
