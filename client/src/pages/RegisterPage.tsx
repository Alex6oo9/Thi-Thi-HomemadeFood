/**
 * Registration page with comprehensive validation.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApiError } from '../hooks/useApiError';
import { registerSchema } from '../lib/validation';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { api } from '../lib/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const { getErrorMessage, getFieldErrors } = useApiError();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    // Build registration data
    const registrationData = {
      email: formData.email,
      password: formData.password,
      profile:
        formData.firstName || formData.lastName
          ? {
              firstName: formData.firstName || undefined,
              lastName: formData.lastName || undefined,
            }
          : undefined,
    };

    // Client-side validation
    const result = registerSchema.safeParse(registrationData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        const field = path === 'profile.firstName' ? 'firstName' :
                      path === 'profile.lastName' ? 'lastName' :
                      issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await register(
        formData.email,
        formData.password,
        registrationData.profile
      );
      setRegEmail(formData.email);
      setRegistered(true);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setGeneralError(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('sending');
    try {
      await api.resendVerification(regEmail);
    } catch {
      // always show success to prevent enumeration
    }
    setResendStatus('sent');
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-600 mb-2">
                We've sent a verification link to
              </p>
              <p className="font-medium text-gray-900 mb-6">{regEmail}</p>
              <p className="text-sm text-gray-500 mb-8">
                Click the link in the email to verify your account. The link expires in 24 hours.
              </p>
              {resendStatus === 'sent' ? (
                <p className="text-sm text-green-600 font-medium">Verification email resent!</p>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleResend}
                  loading={resendStatus === 'sending'}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Resend verification email
                </Button>
              )}
              <div className="mt-6">
                <Link to="/login" className="text-sm text-burmese-ruby hover:text-red-700 font-medium">
                  Back to login
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img
              src="/thithi_logo.jpg"
              alt="Thi Thi"
              className="w-20 h-20 mx-auto rounded-full shadow-lg"
            />
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-gray-600">
            Join Thi Thi to order delicious homemade Burmese food
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {generalError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{generalError}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                placeholder="John"
                icon={<User className="w-5 h-5" />}
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Min 12 characters"
                icon={<Lock className="w-5 h-5" />}
                autoComplete="new-password"
                helperText="Must include uppercase, lowercase, number, and special character"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Input
              label="Confirm password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              icon={<Lock className="w-5 h-5" />}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={isSubmitting}
              icon={<UserPlus className="w-5 h-5" />}
            >
              Create account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <GoogleSignInButton mode="signup" />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-burmese-ruby hover:text-red-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
