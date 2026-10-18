import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export const SizeRecommenderModal = ({ isOpen, onClose, categoryId, productId, onSelectSize }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [fitPreference, setFitPreference] = useState('regular');
  const [saveToProfile, setSaveToProfile] = useState(true);

  const [calculating, setCalculating] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      if (profile.height_cm) setHeight(profile.height_cm.toString());
      if (profile.weight_kg) setWeight(profile.weight_kg.toString());
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!height || !weight) {
      toast.error('Please enter your height and weight');
      return;
    }

    try {
      setCalculating(true);
      const res = await api.post('/size/recommend', {
        categoryId,
        productId,
        height_cm: Number(height),
        weight_kg: Number(weight),
        chest_cm: chest ? Number(chest) : null,
        waist_cm: waist ? Number(waist) : null,
        fit_preference: fitPreference,
        saveToProfile: user ? saveToProfile : false
      });

      if (res.success && res.data) {
        setRecommendation(res.data);
        if (saveToProfile && user) {
          refreshProfile();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to compute size');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-['Syne'] text-xl font-bold text-neutral-900">
            Recommend My Size
          </h3>
        </div>
        <p className="text-xs text-stone-500 mb-6">
          AI rule-based sizing engine calculates your ideal fit using height, weight, and biometric ratios.
        </p>

        {!recommendation ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 178"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Chest (cm, optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Waist (cm, optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 84"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            {/* Fit Preference */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Preferred Fit Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'slim', label: 'Slim / Snug' },
                  { id: 'regular', label: 'Regular' },
                  { id: 'relaxed', label: 'Relaxed / Oversized' }
                ].map((fit) => (
                  <button
                    key={fit.id}
                    type="button"
                    onClick={() => setFitPreference(fit.id)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition ${
                      fitPreference === fit.id
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {fit.label}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="rounded border-stone-300 text-neutral-950 focus:ring-0"
                />
                <span className="text-xs text-stone-600">Save height & weight to my profile for future orders</span>
              </label>
            )}

            <button
              type="submit"
              disabled={calculating}
              className="w-full mt-4 py-3 bg-neutral-950 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {calculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Calculating Fit...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Find My Best Fit</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center p-6 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
                Recommended Size
              </span>
              <div className="text-5xl font-black font-['Syne'] text-neutral-950 my-2">
                {recommendation.recommendedSize}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                {recommendation.confidence.toUpperCase()} CONFIDENCE
              </div>
              <p className="text-xs text-stone-600 mt-3 px-2 leading-relaxed">
                {recommendation.explanation}
              </p>

              {!recommendation.inStock && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex flex-col gap-1 text-left">
                  <span className="font-bold">Size {recommendation.recommendedSize} is currently sold out.</span>
                  {recommendation.alternativeSize && (
                    <span>We suggest nearest in-stock alternative: <strong>Size {recommendation.alternativeSize}</strong>.</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setRecommendation(null)}
                className="py-3 px-4 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition"
              >
                Recalculate
              </button>

              {recommendation.alternativeSize && !recommendation.inStock && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectSize) onSelectSize(recommendation.alternativeSize);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition flex items-center justify-center gap-1 shadow-md"
                >
                  <span>Select Alternative Size {recommendation.alternativeSize}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onSelectSize) onSelectSize(recommendation.recommendedSize);
                  onClose();
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-md ${
                  recommendation.inStock
                    ? 'bg-neutral-950 text-white hover:bg-neutral-800'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                <span>Select Size {recommendation.recommendedSize}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
