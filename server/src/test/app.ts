import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from '../config/passport';
import mongoSanitize from 'express-mongo-sanitize';

// Routes
import authRoutes from '../routes/auth';
import productRoutes from '../routes/products';
import orderRoutes from '../routes/orders';
import uploadRoutes from '../routes/uploads';
import settingsRoutes from '../routes/settings';

/**
 * Create Express app for testing
 * This version excludes:
 * - MongoDB connection (handled by test setup)
 * - Production HTTPS redirect
 * - Helmet (to simplify testing)
 * - Rate limiting (to speed up tests)
 * - MongoStore for sessions (uses memory store)
 */
export function createTestApp() {
  const app = express();

  // Basic middleware
  app.use(cors({
    origin: 'http://localhost:5174',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // MongoDB sanitization
  app.use(mongoSanitize());

  // Session configuration (memory store for tests)
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    },
    name: 'sessionId'
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'test'
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/settings', settingsRoutes);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[TEST ERROR]', err.message);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error' });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
}
