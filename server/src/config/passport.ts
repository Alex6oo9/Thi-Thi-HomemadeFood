import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import { config } from './env';

// Unified Local Strategy - Works for all user roles (customer, admin)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      if (user.authProvider !== 'local') {
        return done(null, false, {
          message: `This account uses ${user.authProvider} login`
        });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // NO ROLE CHECK - Allow all roles to authenticate
      // Role-based access control is enforced at route level via middleware

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy
passport.use(new GoogleStrategy(
  {
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: config.googleCallbackUrl
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();

      if (!email) {
        return done(null, false, { message: 'No email provided by Google' });
      }

      let user = await User.findOne({ email });

      if (user) {
        // Link Google account if not already linked
        if (!user.googleId) {
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.isEmailVerified = true; // Google verifies emails
          await user.save();
        }
      } else {
        // Create new user
        user = await User.create({
          email,
          authProvider: 'google',
          googleId: profile.id,
          isEmailVerified: true, // Google verifies emails
          profile: {
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            avatar: profile.photos?.[0]?.value
          }
        });
      }

      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      user.lastLogin = new Date();
      await user.save();

      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }
));

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user._id.toString());
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
