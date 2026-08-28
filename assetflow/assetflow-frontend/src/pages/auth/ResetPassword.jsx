import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, ShieldCheck, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailFromQuery = searchParams.get('email') || '';
  const isResetMode = Boolean(token && emailFromQuery);

  const [email, setEmail] = useState(emailFromQuery);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (isResetMode ? 'Set a new password' : 'Request a password reset'),
    [isResetMode]
  );

  async function handleRequestReset(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to send reset email');
      }

      setStatus(data?.message || 'Check your email for a reset link.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to send reset email');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: emailFromQuery,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to reset password');
      }

      setStatus(data?.message || 'Password reset successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 text-[var(--color-text)]">
      <div className="w-full max-w-[420px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.12)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] mb-1">
            {isResetMode ? (
              <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
            ) : (
              <Package className="w-6 h-6" strokeWidth={1.75} />
            )}
          </div>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-[var(--color-text)] tracking-tight">
            AssetFlow
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">{title}</p>
        </div>

        {error && (
          <div className="p-3 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-lg text-[13px]">
            {error}
          </div>
        )}

        {status && (
          <div className="p-3 bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/40 text-[var(--color-primary)] rounded-lg text-[13px]">
            {status}
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <Input
              id="reset-email"
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              id="reset-email-disabled"
              label="Email Address"
              type="email"
              value={emailFromQuery}
              disabled
            />

            <Input
              id="new-password"
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••"
            />

            <Input
              id="confirm-password"
              label="Confirm Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-[var(--color-border)]">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] hover:underline font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}