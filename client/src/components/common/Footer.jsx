import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-neutral-950 text-stone-400 text-sm border-t border-neutral-800">
      {/* Brand Value Pillars */}
      <div className="border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">AI Virtual Try-On</h4>
              <p className="text-xs text-stone-400 mt-0.5">Preview actual drape on your photo before buying.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Express Shipping</h4>
              <p className="text-xs text-stone-400 mt-0.5">Free dispatch on all orders above ₹999.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Hassle-Free Returns</h4>
              <p className="text-xs text-stone-400 mt-0.5">7-day doorstep pickup & instant refunds.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Secure Payments</h4>
              <p className="text-xs text-stone-400 mt-0.5">Powered by Razorpay 256-bit encryption.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="font-['Syne'] text-3xl font-black text-white tracking-tighter">
            MAXFIT
          </Link>
          <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
            MAX-FIT Men's Clothing: precision tailoring, heavyweight textiles, and generative virtual try-on designed exclusively for men.
          </p>
          <div className="pt-2 text-[11px] text-stone-500">
            Powered by IDM-VTON (Diffusion High-Fidelity Try-On) & Supabase Postgres.
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Men's Collections</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/shop?category=checks-shirt" className="hover:text-white transition">Checks Shirt</Link></li>
            <li><Link to="/shop?category=t-shirt" className="hover:text-white transition">T-shirt</Link></li>
            <li><Link to="/shop?category=hoodies-sweatshirt" className="hover:text-white transition">Hoodies & Sweatshirt</Link></li>
            <li><Link to="/shop?category=casual-shirts" className="hover:text-white transition">Casual Shirts</Link></li>
            <li><Link to="/shop?category=mens-jacket" className="hover:text-white transition">Men's Jacket</Link></li>
            <li><Link to="/shop?category=pants-jeans" className="hover:text-white transition">Pants Jeans</Link></li>
            <li><Link to="/shop?category=cargo" className="hover:text-white transition">Cargo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">AI Features</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/tryon" className="hover:text-white transition flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-amber-400" /> Try-On Studio</Link></li>
            <li><Link to="/tryon/history" className="hover:text-white transition">Saved Outfits</Link></li>
            <li><span className="text-stone-500">BMI Size Heuristic Engine</span></li>
            <li><span className="text-stone-500">Automated GST Invoicing</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Customer Care</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/profile" className="hover:text-white transition">My Profile</Link></li>
            <li><Link to="/orders" className="hover:text-white transition">Track Orders</Link></li>
            <li><span className="text-stone-400">help@maxfit.studio</span></li>
            <li><span className="text-stone-400">Mon - Sat: 10 AM - 7 PM IST</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-900 py-6 text-center text-xs text-stone-600">
        <p>© 2026 MAXFIT Apparel Studio. All rights reserved. IDM-VTON academic & research implementation.</p>
      </div>
    </footer>
  );
};
