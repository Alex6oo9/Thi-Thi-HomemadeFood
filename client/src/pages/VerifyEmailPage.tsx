/**
 * Email verification page — handles /verify-email?token=...
 * Uses a ref guard to prevent double-call in React StrictMode.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const token = searchParams.get('token') ?? '';
  const called = useRef(false);

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found. Please use the link from your email.');
      return;
    }

    api
      .verifyEmail(token)
      .then((response) => {
        setStatus('success');
        if (response.autoLogin) {
          // Session is set server-side — refresh React Query auth state
          refreshUser();
          setTimeout(() => navigate('/', { replace: true }), 2000);
        }
      })
      .catch((err: any) => {
        setStatus('error');
        setErrorMessage(
          err?.error ?? 'Verification failed. The link may have expired or already been used.'
        );
      });
  }, [token, navigate, refreshUser]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendStatus('sending');
    try {
      await api.resendVerification(resendEmail);
    } catch {
      // always show success to prevent enumeration
    }
    setResendStatus('sent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-burmese-ruby mx-auto mb-4" />
              <p className="text-gray-600">Verifying your email…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h2>
              <p className="text-gray-600">Redirecting you to the homepage…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>

              {resendStatus === 'sent' ? (
                <p className="text-sm text-green-700 font-medium mb-6">
                  Verification email sent! Check your inbox.
                </p>
              ) : (
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-gray-500">Need a new link? Enter your email:</p>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burmese-ruby"
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleResend}
                    loading={resendStatus === 'sending'}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Resend verification email
                  </Button>
                </div>
              )}

              <Link to="/login" className="text-sm text-burmese-ruby hover:text-red-700 font-medium">
                Back to login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
