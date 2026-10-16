import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Ruler, 
  Lock, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Sparkles,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();

  // Basic Profile & Fit State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setHeightCm(profile.height_cm ? profile.height_cm.toString() : '');
      setWeightKg(profile.weight_kg ? profile.weight_kg.toString() : '');
    }
  }, [profile]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/auth/addresses');
      if (res.success) setAddresses(res.data || []);
    } catch (err) {
      console.warn('Addresses load error:', err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.patch('/auth/profile', {
        full_name: fullName,
        phone,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null
      });
      toast.success(res.message);
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newAddr.pincode)) {
      toast.error('Pincode must be 6 digits');
      return;
    }

    try {
      await api.post('/auth/addresses', newAddr);
      toast.success('Address saved');
      setShowAddressForm(false);
      setNewAddr({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false });
      await fetchAddresses();
    } catch (err) {
      toast.error(err.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/auth/addresses/${id}`);
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('Address removed');
    } catch (err) {
      toast.error('Failed to remove address');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-['Syne'] text-3xl font-black text-neutral-950">
          Account & Fit Profile
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Manage your personal details, biometric sizing measurements, and shipping addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details & Size Profile Form */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-950" />
            <h3 className="font-['Syne'] text-base font-bold text-neutral-950">
              Personal Information
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Read Only)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full text-xs bg-stone-100 border border-stone-200 rounded-xl p-3 text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
              />
            </div>

            {/* Sizing Biometrics */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-xs font-bold text-neutral-950">Biometric Sizing Profile</h4>
              </div>
              <p className="text-[11px] text-stone-500 mb-3">
                Used to instantly calculate your recommended size across the catalogue.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 178"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Right: Security & Password Update */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-neutral-950" />
              <h3 className="font-['Syne'] text-base font-bold text-neutral-950">
                Security & Password
              </h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword || !newPassword}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-neutral-950 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="p-6 bg-stone-100 rounded-3xl border border-stone-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-neutral-950">Sign Out</h4>
              <p className="text-[11px] text-stone-500">Sign out of this browser session</p>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-stone-200 transition flex items-center gap-1.5 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Address Book Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-950" />
            <h3 className="font-['Syne'] text-lg font-bold text-neutral-950">
              Saved Delivery Addresses ({addresses.length})
            </h3>
          </div>
          <button
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </button>
        </div>

        {showAddressForm && (
          <form onSubmit={handleAddAddress} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-wider">New Address Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={newAddr.name}
                onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                className="text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                className="text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                required
              />
            </div>

            <input
              type="text"
              placeholder="Address Line 1 (Flat, House no., Building) *"
              value={newAddr.line1}
              onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
              required
            />

            <input
              type="text"
              placeholder="Address Line 2 (Area, Street) *"
              value={newAddr.line2}
              onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="City *"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                required
              />
              <input
                type="text"
                placeholder="State *"
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                className="text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                required
              />
              <input
                type="text"
                placeholder="6-digit PIN *"
                maxLength={6}
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                className="text-xs bg-white border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900 font-mono"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddressForm(false)}
                className="px-4 py-2.5 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-neutral-950">{addr.name}</span>
                  {addr.is_default && (
                    <span className="text-[10px] bg-neutral-950 text-white px-2 py-0.5 rounded-full font-bold">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 line-clamp-2">{addr.line1}, {addr.line2}</p>
                <p className="text-xs text-stone-600 mt-0.5">{addr.city}, {addr.state} - {addr.pincode}</p>
                <p className="text-[11px] text-stone-500 mt-1">Phone: {addr.phone}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-200/80 flex justify-end">
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
