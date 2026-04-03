import { Response, NextFunction } from 'express';
import { RequestWithUser, UserRole } from '../types';

// Check if user is authenticated
export const isAuthenticated = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Check if user is a guest (not authenticated)
export const isGuest = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.status(400).json({ error: 'Already authenticated' });
};

// Check specific role
export const hasRole = (role: UserRole) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Check multiple roles
export const hasAnyRole = (...roles: UserRole[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Check if user is admin
export const isAdmin = hasRole('admin');

// Role-specific middleware functions
// Customer-only middleware
export const requireCustomer = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'customer') {
    res.status(403).json({ error: 'Customer access required' });
    return;
  }

  next();
};

// Strict admin-only middleware (alias)
export const requireAdmin = isAdmin;

// Backward compatibility aliases
export const authenticateToken = isAuthenticated;
export const requireRole = hasAnyRole;