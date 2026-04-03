import crypto from 'crypto';

/** Generates a cryptographically random 64-char hex string (256 bits entropy). */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hash of a token — this is what gets stored in the database.
 * The raw token only ever exists in the email link and in server memory for a millisecond.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
