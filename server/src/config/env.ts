import dotenv from 'dotenv';

dotenv.config();

// Fail fast: these are required in all environments
const missing: string[] = [];
if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET');
if (!process.env.MONGODB_URI)    missing.push('MONGODB_URI');
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const secret = process.env.SESSION_SECRET;
if (secret && secret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters');
}

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI as string,
  sessionSecret: process.env.SESSION_SECRET as string,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',
  nodeEnv: process.env.NODE_ENV || 'development',
  cloudinaryUrl: process.env.CLOUDINARY_URL || '',
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'ecommerce/products',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.FROM_EMAIL || 'ThiThi <noreply@resend.dev>',
};

if (!process.env.CLOUDINARY_URL) {
  console.warn('[env] CLOUDINARY_URL not defined — image uploads will fail');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('[env] Google OAuth credentials not configured — Google login will not work');
}
