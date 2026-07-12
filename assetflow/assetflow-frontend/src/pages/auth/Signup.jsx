import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginSuccess } from '../../store/authSlice';
import { Package } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message || 'Registration failed');
      }
      
      // On success, redirect to login page
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4">
      <div className="glass-panel p-10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Employee Account</h2>
        </div>

        <form onSubmit={handleSignup} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400 relative z-10">
          Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
