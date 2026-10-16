import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Sparkles, 
  Menu, 
  X, 
  Search, 
  ShieldCheck, 
  LogOut, 
  Package, 
  SlidersHorizontal 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const Navbar = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-neutral-900 text-stone-200 text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span>Complimentary Express Shipping on Orders Above ₹999</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline text-amber-400 font-semibold">Use code WELCOME10 for 10% OFF</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-700 hover:text-stone-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-['Syne'] text-2xl sm:text-3xl font-black tracking-tighter text-neutral-950 group-hover:text-stone-700 transition">
              MAXFIT
            </span>
            <span className="hidden sm:inline-block text-[9px] uppercase tracking-widest font-bold bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded border border-neutral-300">
              STUDIO
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-stone-700">
            <Link to="/shop" className="hover:text-neutral-950 transition">Shop All</Link>
            <Link to="/shop?gender=men" className="hover:text-neutral-950 transition">Men</Link>
            <Link to="/shop?gender=women" className="hover:text-neutral-950 transition">Women</Link>
            <Link to="/shop?sort=newest" className="hover:text-neutral-950 transition">New Arrivals</Link>

            {/* Virtual Try-On Studio Glow Button */}
            <Link
              to="/tryon"
              className="relative group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-neutral-900 to-stone-800 text-white shadow-md hover:shadow-neutral-400/50 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>AI Try-On Studio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </Link>
          </nav>

          {/* Search Bar & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Desktop Search Input */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center relative w-48 focus-within:w-64 transition-all duration-300">
              <input
                type="text"
                placeholder="Search styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-stone-100/80 rounded-full pl-9 pr-3 py-2 border border-stone-200 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            </form>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="p-2 text-stone-700 hover:text-neutral-950 hover:bg-stone-100 rounded-full transition"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Bag / Cart Link */}
            <Link
              to="/cart"
              className="relative p-2 text-stone-700 hover:text-neutral-950 hover:bg-stone-100 rounded-full transition"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-950 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-stone-100 transition focus:outline-none border border-transparent focus:border-stone-300"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-neutral-950 truncate">
                        {profile?.full_name || 'Member'}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-neutral-950 transition"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile & Fit</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-neutral-950 transition"
                    >
                      <Package className="w-4 h-4" />
                      <span>Orders & Invoices</span>
                    </Link>

                    <Link
                      to="/tryon/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-neutral-950 transition"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>My Try-On History</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition border-t border-stone-100"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition border-t border-stone-100 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold tracking-wide uppercase px-4 py-2 rounded-full border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search garments, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-stone-100 rounded-xl pl-9 pr-3 py-2 border border-stone-200 focus:outline-none"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          </form>

          <div className="flex flex-col gap-2 pt-2 text-sm font-semibold text-stone-800">
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-stone-100">Shop All</Link>
            <Link to="/shop?gender=men" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-stone-100">Men</Link>
            <Link to="/shop?gender=women" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-stone-100">Women</Link>
            <Link to="/tryon" onClick={() => setMobileMenuOpen(false)} className="py-2.5 flex items-center gap-2 text-amber-600 font-bold">
              <Sparkles className="w-4 h-4" />
              AI Virtual Try-On Studio
            </Link>
            <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-stone-100">Wishlist</Link>
            <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-stone-100">Shopping Bag ({cartCount})</Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="py-2 text-indigo-600 font-bold">
                Admin Console
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
