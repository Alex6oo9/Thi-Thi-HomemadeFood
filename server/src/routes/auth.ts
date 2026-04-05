import express, { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import { User, IUser } from '../models/User';
import { EmailVerificationToken } from '../models/EmailVerificationToken';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { isAuthenticated, isGuest } from '../middleware/auth';
import { regenerateSession } from '../utils/sessionHelpers';
import { body, query, validationResult } from 'express-validator';
import { authLimiter } from '../middleware/rateLimiter';
import { config } from '../config/env';
import { generateToken, hashToken } from '../utils/tokenUtils';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),

  body('password')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/
    ).withMessage('Password must contain uppercase, lowercase, number, and special character'),

  body('role')
    .optional()
    .isIn(['customer']).withMessage('Invalid role'),

  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters')
    .escape(),

  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters')
    .escape(),

  body('profile.phone')
    .optional()
    .trim()
    .matches(/^[0-9]{7,15}$/).withMessage('Invalid phone number format')
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

// Register
router.post('/register', authLimiter, isGuest, registerValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, profile } = req.body;

    // Prevent admin registration via public endpoint
    if (role && role !== 'customer') {
      return res.status(403).json({
        error: 'Cannot register as admin. Contact administrator.'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: 'customer',
      profile
    });

    // Generate verification token and store hash
    const token = generateToken();
    const tokenHash = hashToken(token);
    await EmailVerificationToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send verification email (non-blocking)
    const name = profile?.firstName ?? null;
    sendVerificationEmail(user.email, name, token).catch(console.error);

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account before logging in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Unified Login - Works for all user roles
router.post('/login', authLimiter, isGuest, loginValidation, (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block unverified users
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        email: user.email
      });
    }

    regenerateSession(req, user, (err) => {
      if (err) return next(err);
      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    });
  })(req, res, next);
});

// Admin Login - Alias to main login (for backward compatibility)
router.post('/admin/login', authLimiter, isGuest, loginValidation, (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block unverified users
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        email: user.email
      });
    }

    regenerateSession(req, user, (err) => {
      if (err) return next(err);
      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    });
  })(req, res, next);
});

// Logout
router.post('/logout', isAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('sessionId');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// GET /verify-email?token=...
router.get('/verify-email', [
  query('token').notEmpty().withMessage('Token is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid or missing token' });
    }

    const { token } = req.query as { token: string };
    const tokenHash = hashToken(token);

    const record = await EmailVerificationToken.findOne({ tokenHash });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification link.' });
    }

    if (record.expiresAt < new Date()) {
      await EmailVerificationToken.deleteOne({ _id: record._id });
      return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    // Mark user as verified and delete all verification tokens
    user.isEmailVerified = true;
    await user.save();
    await EmailVerificationToken.deleteMany({ userId: user._id });

    // Auto-login the user
    regenerateSession(req, user, (err) => {
      if (err) return next(err);
      res.json({
        message: 'Email verified successfully!',
        autoLogin: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// POST /resend-verification
router.post('/resend-verification', authLimiter, [
  body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email')
], async (req: Request, res: Response) => {
  // Always return generic message to prevent enumeration
  const GENERIC = 'If that email is registered and unverified, we\'ve sent a new verification link.';

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ message: GENERIC });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user && !user.isEmailVerified && user.authProvider === 'local') {
      // Delete old tokens and generate a fresh one
      await EmailVerificationToken.deleteMany({ userId: user._id });

      const token = generateToken();
      await EmailVerificationToken.create({
        userId: user._id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const name = user.profile?.firstName ?? null;
      sendVerificationEmail(user.email, name, token).catch(console.error);
    }

    res.json({ message: GENERIC });
  } catch (error) {
    res.json({ message: GENERIC });
  }
});

// POST /forgot-password
router.post('/forgot-password', [
  body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email')
], async (req: Request, res: Response) => {
  const GENERIC = 'If that email is registered, we\'ve sent a password reset link.';

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ message: GENERIC });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user && user.authProvider === 'local') {
      // Delete any unused reset tokens for this user
      await PasswordResetToken.deleteMany({ userId: user._id, used: false });

      const token = generateToken();
      await PasswordResetToken.create({
        userId: user._id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });

      const name = user.profile?.firstName ?? null;
      sendPasswordResetEmail(user.email, name, token).catch(console.error);
    }

    res.json({ message: GENERIC });
  } catch (error) {
    res.json({ message: GENERIC });
  }
});

// POST /reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const record = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    const user = await User.findById(record.userId).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    // Update password and mark email verified (in case they reset before verifying)
    user.password = password;
    user.isEmailVerified = true;
    await user.save();

    // Mark token as used
    record.used = true;
    await record.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
});

// Google OAuth
router.get('/google',
  (req, res, next) => {
    if (req.isAuthenticated()) {
      return res.redirect(`${config.clientUrl}/`);
    }
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.clientUrl}/login` }),
  (req, res, next) => {
    if (!req.user) {
      return res.redirect(`${config.clientUrl}/login`);
    }
    regenerateSession(req, req.user as IUser, (err) => {
      if (err) return next(err);
      res.redirect(`${config.clientUrl}/`);
    });
  }
);

// Get current user
router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    user: {
      id: req.user!._id,
      email: req.user!.email,
      role: req.user!.role,
      profile: req.user!.profile
    }
  });
});

export default router;
