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
    <div className="min-h-screen flex items-center justify-center bg-[#000000] p-4 text-[#F5F5F7]">
      <div className="w-full max-w-[420px] bg-[#1C1C1E] border border-[#38383A] rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.60)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#202022] border border-[#38383A] flex items-center justify-center text-[#0A84FF] mb-1">
            {isResetMode ? (
              <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
            ) : (
              <Package className="w-6 h-6" strokeWidth={1.75} />
            )}
          </div>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-[#F5F5F7] tracking-tight">
            AssetFlow
          </h1>
          <p className="text-[14px] text-[#98989D]">{title}</p>
        </div>

        {error && (
          <div className="p-3 bg-[#330C0A] border border-[#FF453A]/40 text-[#FF6961] rounded-lg text-[13px]">
            {error}
          </div>
        )}

        {status && (
          <div className="p-3 bg-[#0F2A1A] border border-[#30D158]/40 text-[#32D74B] rounded-lg text-[13px]">
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

        <div className="text-center pt-2 border-t border-[#38383A]">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] text-[#0A84FF] hover:underline font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}