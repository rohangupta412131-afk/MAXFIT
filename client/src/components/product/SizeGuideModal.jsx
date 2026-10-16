import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../config/api';

export const SizeGuideModal = ({ isOpen, onClose, categoryId, categoryName = 'Apparel' }) => {
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && categoryId) {
      setLoading(true);
      api.get(`/size/chart/${categoryId}`)
        .then(res => setChart(res.data || []))
        .catch(err => console.warn('Could not load size chart:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, categoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-['Syne'] text-xl font-bold text-neutral-900">
          Size Guide: {categoryName}
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          All body measurements in centimeters (cm). Use a soft measuring tape keeping it snug but not tight.
        </p>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="mt-6 border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-neutral-900 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Chest (cm)</th>
                  <th className="py-3 px-4">Waist (cm)</th>
                  <th className="py-3 px-4">Hip (cm)</th>
                  <th className="py-3 px-4">Height Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {chart.length > 0 ? (
                  chart.map((row) => (
                    <tr key={row.id || row.size} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 font-bold text-neutral-950">{row.size}</td>
                      <td className="py-3 px-4 text-stone-600">{row.chest_cm ? `${row.chest_cm} cm` : '-'}</td>
                      <td className="py-3 px-4 text-stone-600">{row.waist_cm ? `${row.waist_cm} cm` : '-'}</td>
                      <td className="py-3 px-4 text-stone-600">{row.hip_cm ? `${row.hip_cm} cm` : '-'}</td>
                      <td className="py-3 px-4 text-stone-600">
                        {row.height_min && row.height_max ? `${row.height_min} - ${row.height_max} cm` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-stone-400">Standard fit measurements applicable.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-neutral-900">How to Measure:</p>
          <p>• <strong>Chest:</strong> Measure around the fullest part of your chest, keeping tape horizontal.</p>
          <p>• <strong>Waist:</strong> Measure around the narrowest part of your natural waistline.</p>
        </div>
      </div>
    </div>
  );
};
