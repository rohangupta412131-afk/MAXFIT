import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { useCart } from '../context/CartContext';

export const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      if (res.success) {
        setItems(res.data || []);
      }
    } catch (err) {
      console.warn('Wishlist load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems(items.filter(i => i.id !== productId));
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleMoveToBag = async (product) => {
    const firstVariant = product.variants?.find(v => v.stock > 0);
    if (!firstVariant) {
      toast.error('This product is currently out of stock');
      return;
    }

    const success = await addToCart(firstVariant.id, 1);
    if (success) {
      await handleRemove(product.id);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="font-['Syne'] text-3xl font-black text-neutral-950">
          Your Wishlist is Empty
        </h2>
        <p className="text-stone-500 text-sm max-w-sm mx-auto">
          Save garments you love to track availability and preview with AI virtual try-on.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-['Syne'] text-3xl font-black text-neutral-950">
          My Saved Styles ({items.length})
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((prod) => (
          <div
            key={prod.id}
            className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-sm"
          >
            <Link to={`/product/${prod.slug}`} className="relative block aspect-[3/4] bg-stone-100 overflow-hidden">
              <img
                src={prod.images?.[0] || prod.garment_image}
                alt={prod.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(prod.id);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-rose-50 hover:text-rose-600 transition shadow-sm text-stone-600"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Link>

            <div className="p-4 flex flex-col flex-1 justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  {prod.category?.name || 'MAXFIT'}
                </span>
                <Link to={`/product/${prod.slug}`} className="font-bold text-xs text-neutral-950 line-clamp-1 hover:underline">
                  {prod.name}
                </Link>
                <div className="mt-2 text-sm font-black font-['Syne'] text-neutral-950">
                  ₹{Number(prod.price).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => handleMoveToBag(prod)}
                  className="w-full py-2.5 px-3 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
