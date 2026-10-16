import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    discount: 0,
    shippingFee: 0,
    gstBreakdown: { gst5: 0, gst12: 0, totalTax: 0 },
    total: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setCartSummary({ subtotal: 0, discount: 0, shippingFee: 0, gstBreakdown: { gst5: 0, gst12: 0, totalTax: 0 }, total: 0 });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.success && res.data) {
        setCartItems(res.data.items || []);
        setCartSummary(res.data.summary || {});
      }
    } catch (err) {
      console.warn('Cart load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (variantId, qty = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to your bag');
      return false;
    }

    try {
      await api.post('/cart', { variant_id: variantId, qty });
      toast.success('Item added to your bag');
      await fetchCart();
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not add to bag');
      return false;
    }
  };

  const updateQty = async (cartItemId, qty) => {
    try {
      await api.patch(`/cart/${cartItemId}`, { qty });
      await fetchCart();
    } catch (err) {
      toast.error(err.message || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      toast.success('Item removed from bag');
      await fetchCart();
    } catch (err) {
      toast.error(err.message || 'Failed to remove item');
    }
  };

  const applyCouponCode = async (code) => {
    try {
      const res = await api.post('/cart/apply-coupon', { code });
      toast.success(res.message || 'Coupon applied!');
      setCartSummary(res.data.summary);
      return res.data;
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
      throw err;
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartSummary,
      loading,
      addToCart,
      updateQty,
      removeFromCart,
      applyCouponCode,
      refreshCart: fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
