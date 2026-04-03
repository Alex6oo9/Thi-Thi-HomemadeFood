/**
 * Forgot password page — /forgot-password
 * Always shows generic success to prevent email enumeration.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

type State = 'idle' | 'loading' | 'sent';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    setState('loading');
    try {
      await api.forgotPassword(email);
    } catch {
      // always show generic success
    }
    setState('sent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <Link
          to="/login"
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-burmese-ruby transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to login</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forgot password?</h1>
          <p className="mt-2 text-gray-600">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <Card>
          {state === 'sent' ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-600 text-sm">
                If that email is registered, we've sent a password reset link. It expires in 1 hour.
              </p>
              <div className="mt-6">
                <Link to="/login" className="text-sm text-burmese-ruby hover:text-red-700 font-medium">
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                error={emailError}
                placeholder="you@example.com"
                icon={<Mail className="w-5 h-5" />}
                autoComplete="email"
                required
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={state === 'loading'}
                icon={<Send className="w-5 h-5" />}
              >
                Send reset link
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
