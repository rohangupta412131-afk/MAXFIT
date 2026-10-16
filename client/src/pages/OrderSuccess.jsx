import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, Sparkles, ArrowRight, Download } from 'lucide-react';

export const OrderSuccess = () => {
  const { orderNumber } = useParams();

  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce-slow shadow-lg">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Payment Confirmed
        </span>
        <h1 className="font-['Syne'] text-4xl font-black text-neutral-950">
          Thank you for your order!
        </h1>
        <p className="text-stone-600 text-sm max-w-md mx-auto">
          Your order has been placed successfully and is being prepared for express dispatch.
        </p>
      </div>

      {orderNumber && (
        <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200/80 max-w-sm mx-auto shadow-sm">
          <span className="text-xs text-stone-500 uppercase tracking-wider block">Order Reference</span>
          <span className="text-xl font-bold font-mono text-neutral-950 block mt-1">
            {orderNumber}
          </span>
          <span className="text-[11px] text-stone-400 block mt-2">
            GST invoice has been generated and saved to your account.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          to="/orders"
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span>View My Orders</span>
        </Link>

        <Link
          to="/tryon"
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-neutral-950 border border-stone-300 font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition shadow-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Try Another Garment</span>
        </Link>
      </div>
    </div>
  );
};
