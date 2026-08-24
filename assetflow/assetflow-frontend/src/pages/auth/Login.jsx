import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginSuccess } from '../../store/authSlice';
import { useLoginMutation } from '../../store/apiSlice';
import { Package } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [login, { isLoading, error: loginError }] = useLoginMutation();
  const successMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      dispatch(loginSuccess({
        user: response.data.user,
        token: response.data.token
      }));
      navigate('/');
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 text-[var(--color-text)]">
      <div className="w-full max-w-[420px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-8 shadow-surface-lg space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] mb-1">
            <Package className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-[var(--color-text)] tracking-tight">
            AssetFlow
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Sign in to manage organizational assets
          </p>
        </div>

        {successMessage && (
          <div className="p-3 bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/40 text-[var(--color-primary)] rounded-lg text-[13px]">
            {successMessage}
          </div>
        )}

        {loginError && (
          <div className="p-3 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-lg text-[13px]">
            {loginError.data?.error?.message || loginError.data?.message || 'Invalid email or password.'}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            id="login-email"
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@assetflow.com"
          />

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="login-password" className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
                Password
              </label>
              <Link to="/reset-password" className="text-[12px] text-[var(--color-primary)] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 transition-colors"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-[13px] text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[var(--color-primary)] hover:underline font-medium">
            Create Employee Account
          </Link>
        </p>
      </div>
    </div>
  );
}
