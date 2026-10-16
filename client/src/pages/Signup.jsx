import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const Signup = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await signUp(formData);
      toast.success('Account created successfully! Welcome to MAXFIT.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
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
          <h2 className="text-lg font-bold text-neutral-900">Create your account</h2>
          <p className="text-xs text-stone-500">
            Join the community for exclusive drops, fit profile, and AI virtual try-on.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Jane Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-neutral-900"
                required
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                placeholder="jane@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-neutral-900"
                required
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-neutral-900"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
            <div className="relative">
              <input
                type="password"
                placeholder="•••••••• (Min 6 characters)"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Already have an account?{' '}
          <Link to="/login" className="text-neutral-950 font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
