import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSignupMutation } from '../../store/apiSlice';
import { Package } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const [signup, { isLoading, error: signupError }] = useSignupMutation();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await signup({ name, email, password }).unwrap();
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } catch (err) {
      console.error('Signup failed', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 text-[var(--color-text)]">
      <div className="w-full max-w-[420px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.12)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] mb-1">
            <Package className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-[var(--color-text)] tracking-tight">
            Create Account
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Sign up for employee equipment portal
          </p>
        </div>

        {signupError && (
          <div className="p-3 bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 text-[var(--color-error)] rounded-lg text-[13px]">
            {signupError.data?.error?.message || signupError.data?.message || 'Signup failed'}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            id="signup-name"
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />

          <Input
            id="signup-email"
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane.doe@company.com"
          />

          <Input
            id="signup-password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            helperText="Minimum 8 characters with letters and numbers."
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-[13px] text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
