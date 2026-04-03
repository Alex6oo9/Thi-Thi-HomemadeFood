import { Request } from 'express';
import { IUser } from '../models/User';

/**
 * Safely regenerate session after authentication
 * Prevents session fixation attacks by creating a new session ID
 *
 * @param req - Express request object with session
 * @param user - Authenticated user to login
 * @param callback - Callback function called after regeneration
 */
export const regenerateSession = (
  req: Request,
  user: IUser,
  callback: (err?: any) => void
): void => {
  // Regenerate the session to prevent session fixation attacks
  req.session.regenerate((err) => {
    if (err) {
      console.error('[SESSION] Regeneration failed:', err);
      return callback(err);
    }

    // Login the user with Passport in the new session
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('[SESSION] Login after regeneration failed:', loginErr);
        return callback(loginErr);
      }

      console.log(`[SESSION] Session regenerated successfully for user: ${user._id}`);
      callback();
    });
  });
};
