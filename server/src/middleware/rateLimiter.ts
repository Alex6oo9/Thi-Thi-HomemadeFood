import rateLimit from 'express-rate-limit';

const skipInTest = () => process.env.NODE_ENV === 'test' && !process.env.RENDER;

// Rate limiting for authentication endpoints (prevents brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 login attempts per 15 min per IP
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  skip: skipInTest
});

// Rate limiting for file uploads (expensive operations)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,                   // 20 uploads per hour per IP
  message: 'Upload limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest
});

// Rate limiting for order creation (prevents order spam)
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,                   // 20 orders per hour per IP
  message: 'Too many orders placed. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest
});

// Rate limiting for forgot password (prevents email spam abuse)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 requests per hour per IP
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest
});

// General API rate limiting (prevents abuse)
// No background polling — customers refresh manually, so 300/15 min is ample
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest
});
