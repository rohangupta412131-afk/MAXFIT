import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabase';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link');
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
          <h2 className="text-lg font-bold text-neutral-900">Reset your password</h2>
          <p className="text-xs text-stone-500">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        {!submitted ? (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-neutral-950 text-white rounded-full text-xs font-extrabold uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h3 className="font-bold text-sm text-neutral-950">Check your inbox</h3>
            <p className="text-xs text-stone-600">
              We've dispatched a password reset link to <strong>{email}</strong>.
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-bold text-stone-600 hover:text-neutral-950 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
