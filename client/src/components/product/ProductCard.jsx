import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export const ProductCard = ({ product, isWishlisted = false, onWishlistToggle }) => {
  const { user } = useAuth();
  const [inWishlist, setInWishlist] = useState(isWishlisted);
  const [imageIndex, setImageIndex] = useState(0);
  const navigate = useNavigate();

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      return;
    }

    try {
      setInWishlist(!inWishlist);
      const res = await api.post('/wishlist', { product_id: product.id });
      toast.success(res.message);
      if (onWishlistToggle) onWishlistToggle(product.id, !inWishlist);
    } catch (err) {
      setInWishlist(inWishlist); // rollback
      toast.error('Failed to update wishlist');
    }
  };

  const discountPercent = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const primaryImage = product.images?.[imageIndex] || product.garment_image;
  const hoverImage = product.images?.[1] || product.garment_image || primaryImage;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-200/80 hover:border-neutral-900/30 hover:shadow-xl transition-all duration-300">
      {/* Product Image Frame */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[3/4] bg-stone-100 overflow-hidden"
        onMouseEnter={() => setImageIndex(1)}
        onMouseLeave={() => setImageIndex(0)}
      >
        <img
          src={imageIndex === 1 && product.images?.[1] ? hoverImage : primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="bg-neutral-950 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
              {discountPercent}% OFF
            </span>
          )}

          {product.tryon_enabled && (
            <span className="bg-amber-400 text-neutral-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              Try On
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-md transition-all duration-200 ${
            inWishlist
              ? 'bg-rose-50 text-rose-600 scale-110'
              : 'bg-white/80 text-stone-700 hover:text-rose-600 hover:bg-white'
          }`}
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Try-On Overlay Action */}
        {product.tryon_enabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/tryon?product=${product.id}`);
            }}
            className="absolute bottom-3 inset-x-3 py-2.5 px-3 bg-neutral-950/90 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl backdrop-blur-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Virtual Try-On
          </button>
        )}
      </Link>

      {/* Info Content */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {product.category?.name && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1">
              {product.category.name}
            </span>
          )}
          <Link
            to={`/product/${product.slug}`}
            className="font-semibold text-sm text-neutral-900 line-clamp-1 group-hover:text-neutral-700 transition"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-neutral-950 font-['Syne']">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-stone-400 line-through">
                ₹{Number(product.mrp).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <Link
            to={`/product/${product.slug}`}
            className="text-xs font-semibold text-stone-500 hover:text-neutral-950 transition"
          >
            Select Size →
          </Link>
        </div>
      </div>
    </div>
  );
};
