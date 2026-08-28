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
    <div className="min-h-screen flex items-center justify-center bg-[#000000] p-4 text-[#FDF0D5]">
      <div className="w-full max-w-[420px] bg-[#1C1C1E] border border-[#38383A] rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.60)] space-y-6 animate-in fade-in zoom-in-95 duration-200">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#202022] border border-[#38383A] flex items-center justify-center text-[#249D8F] mb-1">
            <Package className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-[#FDF0D5] tracking-tight">
            AssetFlow
          </h1>
          <p className="text-[14px] text-[#C2B79E]">
            Sign in to manage organizational assets
          </p>
        </div>

        {successMessage && (
          <div className="p-3 bg-[#0B2D29] border border-[#249D8F]/40 text-[#249D8F] rounded-lg text-[13px]">
            {successMessage}
          </div>
        )}

        {loginError && (
          <div className="p-3 bg-[#33160F] border border-[#E76F51]/40 text-[#E76F51] rounded-lg text-[13px]">
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
              <label htmlFor="login-password" className="block text-[13px] font-medium text-[#C2B79E]">
                Password
              </label>
              <Link to="/reset-password" className="text-[12px] text-[#249D8F] hover:underline">
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
              className="w-full h-10 px-3 rounded-lg text-[14px] text-[#FDF0D5] placeholder-[#877F6C] bg-[#202022] border border-[#48484A] focus:outline-none focus:border-[#249D8F] focus:ring-[3px] focus:ring-[#249D8F]/25 transition-colors"
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

        <p className="text-center text-[13px] text-[#C2B79E] pt-2 border-t border-[#38383A]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#249D8F] hover:underline font-medium">
            Create Employee Account
          </Link>
        </p>
      </div>
    </div>
  );
}
