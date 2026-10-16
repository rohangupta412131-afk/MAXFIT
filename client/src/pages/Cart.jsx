import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Heart, ArrowRight, Sparkles, Tag, ShieldCheck, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { api } from '../config/api';

export const Cart = () => {
  const { cartItems, cartSummary, updateQty, removeFromCart, applyCouponCode, loading } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    try {
      setApplyingCoupon(true);
      await applyCouponCode(couponInput.trim());
      setCouponInput('');
    } catch (err) {
      // toast shown in context
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleMoveToWishlist = async (productId, cartItemId) => {
    try {
      await api.post('/wishlist', { product_id: productId });
      await removeFromCart(cartItemId);
      toast.success('Moved to wishlist');
    } catch (err) {
      toast.error('Failed to move to wishlist');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-['Syne'] text-3xl font-black text-neutral-950">
          Your Bag is Empty
        </h2>
        <p className="text-stone-500 text-sm max-w-sm mx-auto">
          Explore our latest collection of heavyweight streetwear and tailored garments.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-['Syne'] text-3xl font-black text-neutral-950">
          Shopping Bag ({cartItems.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.variant?.product;
            const variant = item.variant;
            if (!product || !variant) return null;

            return (
              <div
                key={item.id}
                className="p-5 bg-white rounded-3xl border border-stone-200/80 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
              >
                <div className="flex gap-4 items-center">
                  <Link
                    to={`/product/${product.slug}`}
                    className="w-20 sm:w-24 aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200"
                  >
                    <img
                      src={product.images?.[0] || product.garment_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="space-y-1">
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-bold text-sm text-neutral-950 hover:underline line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <div className="text-xs text-stone-500 flex items-center gap-2">
                      <span>Size: <strong>{variant.size}</strong></span>
                      <span>•</span>
                      <span>Color: <strong>{variant.color}</strong></span>
                    </div>

                    <div className="text-sm font-black font-['Syne'] text-neutral-950 pt-1">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-stone-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-300 rounded-full px-2.5 py-1 bg-stone-50">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-6 h-6 text-stone-600 hover:text-neutral-950 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-neutral-950">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      disabled={item.qty >= variant.stock}
                      className="w-6 h-6 text-stone-600 hover:text-neutral-950 font-bold text-xs disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleMoveToWishlist(product.id, item.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 transition"
                      title="Move to Wishlist"
                    >
                      <Heart className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-stone-400 hover:text-stone-900 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Card */}
        <div className="space-y-6">
          {/* Coupon Input */}
          <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="font-['Syne'] text-sm font-bold text-neutral-950 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>Apply Promotion Coupon</span>
            </h3>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WELCOME10, FLAT200"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 text-xs bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-900 uppercase font-semibold"
              />
              <button
                type="submit"
                disabled={applyingCoupon || !couponInput}
                className="px-4 py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition disabled:opacity-50"
              >
                Apply
              </button>
            </form>

            <div className="text-[11px] text-stone-400">
              Try: <span className="font-mono text-stone-700 font-bold">WELCOME10</span> (10% off) or <span className="font-mono text-stone-700 font-bold">FLAT200</span>
            </div>
          </div>

          {/* Billing Breakdown */}
          <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="font-['Syne'] text-base font-bold text-neutral-950">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-950">₹{cartSummary.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {cartSummary.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{cartSummary.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-bold text-neutral-950">
                  {cartSummary.shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `₹${cartSummary.shippingFee}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Estimated GST Included</span>
                <span>₹{cartSummary.gstBreakdown?.totalTax || 0}</span>
              </div>

              <div className="border-t border-stone-200 pt-3 flex justify-between text-sm font-bold text-neutral-950 font-['Syne']">
                <span>Grand Total</span>
                <span className="text-lg">₹{cartSummary.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-neutral-950 text-white rounded-full text-xs font-extrabold uppercase tracking-wider hover:bg-neutral-800 transition shadow-xl flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay 256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
