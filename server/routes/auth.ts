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

// Register new user
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address, avatar } = req.body;

    // 1. Required fields check
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (name.trim().length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (!phone || !phone.trim()) {
      res.status(400).json({ error: 'Mobile number is required.' });
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
      res.status(400).json({ error: 'Please provide a valid mobile number (8 to 15 digits).' });
      return;
    }

    if (!dateOfBirth) {
      res.status(400).json({ error: 'Date of birth is required.' });
      return;
    }

    if (!gender) {
      res.status(400).json({ error: 'Gender is required.' });
      return;
    }

    if (!address || !address.trim()) {
      res.status(400).json({ error: 'Residential address is required.' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      res.status(400).json({ error: 'Password must contain both letters and numbers.' });
      return;
    }

    // 2. Duplicate email check (active email or pending on another account)
    const existing = db.getUserByEmailWithPassword(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists. Please log in instead.' });
      return;
    }

    const pendingOwner = db.getUserRecordByPendingEmail(cleanEmail);
    if (pendingOwner) {
      res.status(409).json({ error: 'This email address is currently reserved by an in-progress verification. Please use another email or contact support.' });
      return;
    }

    // 3. Role security: always enforce 'patient' for public registration
    const assignedRole = 'patient';
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Profile photo: use provided or fallback
    const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
    const resolvedAvatar = avatar && avatar.trim() ? avatar.trim() : defaultAvatar;

    // 4. Generate verification OTP & token
    const { otp, token: verifyToken, otpHash, tokenHash } = generateVerificationSecrets();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    const newUserRecord = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole as 'patient',
      phone: phone.trim(),
      dateOfBirth,
      gender,
      address: address.trim(),
      avatar: resolvedAvatar,
      isActive: true,
      isEmailVerified: false, // Must be verified before booking appointments
      emailVerificationTokenHash: tokenHash,
      emailVerificationOtpHash: otpHash,
      emailVerificationExpiresAt: expiry,
      emailVerificationAttempts: 0,
      emailVerificationLastSentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    const createdUser = db.createUser(newUserRecord);

    // 5. Send registration verification email
    try {
      await emailService.sendRegistrationVerificationEmail(
        cleanEmail,
        createdUser.name,
        otp,
        verifyToken
      );
    } catch (emailErr) {
      console.error('Error sending registration verification email:', emailErr);
    }

    db.addAuditLog({
      action: 'PATIENT_REGISTERED',
      performedBy: createdUser.name,
      performedByRole: createdUser.role,
      target: createdUser.email,
      details: 'Patient registered. Verification email dispatched.',
    });

    const authToken = generateToken(createdUser);
    res.status(201).json({
      message: 'A verification email has been sent to your email address. Please verify your email to activate your account.',
      user: createdUser,
      token: authToken,
      verificationDetails: {
        email: cleanEmail,
        expiresAt: expiry,
        expiresInMinutes: 15,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Verify email address (OTP or Link Token)
router.post('/verify-email', async (req, res): Promise<void> => {
  try {
    const { email, otp, token } = req.body;

    if (!otp && !token) {
      res.status(400).json({ error: 'Verification code (OTP) or link token is required.' });
      return;
    }

    let userRecord = email ? db.getUserRecordByEmail(email.trim().toLowerCase()) : undefined;

    // If no email provided with token, look up by token hash directly
    if (!userRecord && token) {
      const tokenHash = hashToken(token);
      userRecord = db.getUserRecordByVerificationTokenHash(tokenHash);
    }

    if (!userRecord) {
      res.status(404).json({ error: 'Account not found for email verification.' });
      return;
    }

    // Already verified check
    if (userRecord.isEmailVerified) {
      const sanitized = db.getUserById(userRecord.id)!;
      res.json({
        message: 'Your email address is already verified and active.',
        user: sanitized,
        token: generateToken(sanitized),
      });
      return;
    }

    // Expiry check
    if (!userRecord.emailVerificationExpiresAt || new Date() > new Date(userRecord.emailVerificationExpiresAt)) {
      res.status(400).json({
        error: 'Verification code has expired. Please request a new verification code.',
        isExpired: true,
      });
      return;
    }

    // Attempt rate limiting (max 5 failed attempts)
    const currentAttempts = userRecord.emailVerificationAttempts || 0;
    if (currentAttempts >= 5) {
      res.status(429).json({
        error: 'Too many incorrect attempts. Please request a new verification code to try again.',
        rateLimited: true,
      });
      return;
    }

    let isValid = false;
    if (otp && userRecord.emailVerificationOtpHash) {
      isValid = hashToken(otp) === userRecord.emailVerificationOtpHash;
    } else if (token && userRecord.emailVerificationTokenHash) {
      isValid = hashToken(token) === userRecord.emailVerificationTokenHash;
    }

    if (!isValid) {
      const newAttempts = currentAttempts + 1;
      db.updateUserRecord(userRecord.id, {
        emailVerificationAttempts: newAttempts,
      });
      const remaining = Math.max(0, 5 - newAttempts);
      res.status(400).json({
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        remainingAttempts: remaining,
      });
      return;
    }

    // Mark email as verified and clear secret hashes
    const updated = db.updateUserRecord(userRecord.id, {
      isEmailVerified: true,
      emailVerificationOtpHash: undefined,
      emailVerificationTokenHash: undefined,
      emailVerificationExpiresAt: undefined,
      emailVerificationAttempts: 0,
    });

    const sanitizedUser = db.getUserById(userRecord.id)!;

    db.addAuditLog({
      action: 'EMAIL_VERIFIED',
      performedBy: sanitizedUser.name,
      performedByRole: sanitizedUser.role,
      target: sanitizedUser.email,
      details: 'Patient email address successfully verified and account fully activated.',
    });

    const newAuthToken = generateToken(sanitizedUser);

    res.json({
      message: 'Email successfully verified! Your account is now fully active.',
      user: sanitizedUser,
      token: newAuthToken,
    });
  } catch (err: any) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Failed to verify email address.' });
  }
});

// Resend registration verification email with cooldown & rate limit
router.post('/resend-verification', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Email address is required to resend verification.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRecord = db.getUserRecordByEmail(cleanEmail);
    if (!userRecord) {
      res.status(404).json({ error: 'No account found with this email address.' });
      return;
    }

    if (userRecord.isEmailVerified) {
      res.status(400).json({ error: 'This email address is already verified.' });
      return;
    }

    // Cooldown check: 60 seconds
    const lastSent = userRecord.emailVerificationLastSentAt;
    if (lastSent) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(lastSent).getTime()) / 1000);
      const COOLDOWN_SECONDS = 60;
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remainingSeconds = COOLDOWN_SECONDS - elapsedSeconds;
        res.status(429).json({
          error: `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before requesting a new code.`,
          cooldownRemaining: remainingSeconds,
        });
        return;
      }
    }

    // Generate fresh secrets
    const { otp, token: verifyToken, otpHash, tokenHash } = generateVerificationSecrets();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.updateUserRecord(userRecord.id, {
      emailVerificationOtpHash: otpHash,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiry,
      emailVerificationAttempts: 0,
      emailVerificationLastSentAt: new Date().toISOString(),
    });

    await emailService.sendRegistrationVerificationEmail(
      cleanEmail,
      userRecord.name,
      otp,
      verifyToken
    );

    db.addAuditLog({
      action: 'VERIFICATION_RESENT',
      performedBy: userRecord.name,
      performedByRole: userRecord.role,
      target: cleanEmail,
      details: 'New verification email dispatched with fresh code and 15-minute validity.',
    });

    res.json({
      message: 'A fresh verification email has been sent to your email address.',
      expiresAt: expiry,
      cooldownSeconds: 60,
    });
  } catch (err: any) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// Dev Helper: Get recent sent emails for easy inspection and zero-friction testing
router.get('/recent-emails', (_req, res): void => {
  res.json({ emails: emailService.getRecentEmails() });
});

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const userWithHash = db.getUserByEmailWithPassword(email);
    if (!userWithHash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, userWithHash.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!userWithHash.isActive) {
      res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
      return;
    }

    const { passwordHash, ...user } = userWithHash;
    const token = generateToken(user);

    db.addAuditLog({
      action: 'USER_LOGIN',
      performedBy: user.name,
      performedByRole: user.role,
      target: user.email,
      details: 'User logged in successfully',
    });

    res.json({ user, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Current user profile
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user });
});

// Update profile details
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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

    const updates: Partial<User> = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatar !== undefined) updates.avatar = avatar;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updates.gender = gender;
    if (address !== undefined) updates.address = address;
    if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact;
    if (medicalHistory !== undefined) updates.medicalHistory = medicalHistory;

    const updatedUser = db.updateUser(userId, updates);

    // If user is a doctor, also sync doctor's name, phone, avatar
    if (req.user!.role === 'doctor' && req.user!.doctorId) {
      db.updateDoctor(req.user!.doctorId, {
        name: updates.name,
        phone: updates.phone,
        avatar: updates.avatar,
      });
    }

    db.addAuditLog({
      action: 'PROFILE_UPDATED',
      performedBy: req.user!.name,
      performedByRole: req.user!.role,
      target: req.user!.email,
      details: 'Personal profile details updated',
    });

    res.json({ user: updatedUser });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Both current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const userWithHash = db.getUserByEmailWithPassword(req.user!.email);
    if (!userWithHash) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.updateUserPassword(req.user!.id, newHash);

    db.addAuditLog({
      action: 'PASSWORD_CHANGED',
      performedBy: req.user!.name,
      performedByRole: req.user!.role,
      target: req.user!.email,
      details: 'Password successfully changed',
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
