import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      await signIn({ email, password });
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="font-['Syne'] text-3xl font-black text-neutral-950 tracking-tight">
            MAXFIT
          </Link>
          <h2 className="text-lg font-bold text-neutral-900">Sign in to your account</h2>
          <p className="text-xs text-stone-500">
            Access your orders, saved try-on outfits, and custom fit profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-neutral-900"
                required
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-700">Password</label>
              <Link to="/reset-password" className="text-[11px] text-stone-500 hover:text-neutral-950 underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-neutral-900"
                required
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-neutral-950 text-white rounded-full text-xs font-extrabold uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Don't have an account?{' '}
          <Link to="/signup" className="text-neutral-950 font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
