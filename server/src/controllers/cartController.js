import { supabaseAdmin } from '../config/supabase.js';

// Calculate order summary on server
export const computeCartSummary = (items, coupon = null) => {
  let subtotal = 0;
  let tax5Subtotal = 0;
  let tax12Subtotal = 0;

  for (const item of items) {
    const price = Number(item.variant?.product?.price || 0);
    const lineTotal = price * item.qty;
    subtotal += lineTotal;

    if (price < 1000) {
      tax5Subtotal += lineTotal;
    } else {
      tax12Subtotal += lineTotal;
    }
  }

  // GST calculations: prices are inclusive of GST
  // For 5%: tax = subtotal * (5 / 105)
  // For 12%: tax = subtotal * (12 / 112)
  const gst5 = Math.round((tax5Subtotal * 5 / 105) * 100) / 100;
  const gst12 = Math.round((tax12Subtotal * 12 / 112) * 100) / 100;
  const totalTax = Math.round((gst5 + gst12) * 100) / 100;

  // Coupon discount
  let discount = 0;
  if (coupon && subtotal >= Number(coupon.min_order || 0)) {
    if (coupon.type === 'percent') {
      discount = Math.round((subtotal * Number(coupon.value) / 100) * 100) / 100;
      if (coupon.max_discount && discount > Number(coupon.max_discount)) {
        discount = Number(coupon.max_discount);
      }
    } else if (coupon.type === 'flat') {
      discount = Math.min(Number(coupon.value), subtotal);
    }
  }

  // Shipping policy: Free above INR 999, else INR 79
  const shippingFee = (subtotal - discount) >= 999 || subtotal === 0 ? 0 : 79;
  const grandTotal = Math.max(0, Math.round((subtotal - discount + shippingFee) * 100) / 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount,
    shippingFee,
    gstBreakdown: {
      gst5,
      gst12,
      totalTax
    },
    total: grandTotal,
    couponApplied: coupon ? {
      code: coupon.code,
      discount
    } : null
  };
};

export const getCart = async (req, res, next) => {
  try {
    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        qty,
        variant_id,
        variant:product_variants (
          id,
          size,
          color,
          sku,
          stock,
          product:products (
            id,
            name,
            slug,
            price,
            mrp,
            images,
            garment_image,
            tryon_enabled
          )
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const summary = computeCartSummary(cartItems || []);

    res.json({
      success: true,
      data: {
        items: cartItems || [],
        summary
      }
    });
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { variant_id, qty = 1 } = req.body;

    // Verify variant and stock
    const { data: variant, error: varErr } = await supabaseAdmin
      .from('product_variants')
      .select('id, stock, product:products(name, is_active)')
      .eq('id', variant_id)
      .single();

    if (varErr || !variant) {
      return res.status(404).json({ success: false, error: 'Product variant not found' });
    }

    if (variant.stock <= 0) {
      return res.status(400).json({ success: false, error: 'This size/color is out of stock' });
    }

    // Check existing item
    const { data: existing } = await supabaseAdmin
      .from('cart_items')
      .select('id, qty')
      .eq('user_id', req.user.id)
      .eq('variant_id', variant_id)
      .single();

    const newQty = existing ? Math.min(existing.qty + qty, variant.stock) : Math.min(qty, variant.stock);

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .upsert({
        user_id: req.user.id,
        variant_id,
        qty: newQty
      }, { onConflict: 'user_id,variant_id' })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
      message: 'Item added to bag'
    });
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qty } = req.body;

    if (qty <= 0) {
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id);
      return res.json({ success: true, message: 'Item removed from bag' });
    }

    // Check stock
    const { data: cartItem } = await supabaseAdmin
      .from('cart_items')
      .select('id, variant:product_variants(stock)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!cartItem) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    const finalQty = Math.min(qty, cartItem.variant.stock);

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ qty: finalQty })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Bag updated'
    });
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Item removed from bag'
    });
  } catch (err) {
    next(err);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }

    const { data: coupon, error: coupErr } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (coupErr || !coupon) {
      return res.status(404).json({ success: false, error: 'Invalid or expired coupon code' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Coupon has expired' });
    }

    // Get current cart items
    const { data: cartItems } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        qty,
        variant:product_variants (
          product:products (price)
        )
      `)
      .eq('user_id', req.user.id);

    const summary = computeCartSummary(cartItems || [], coupon);

    if (summary.subtotal < Number(coupon.min_order)) {
      return res.status(400).json({
        success: false,
        error: `Coupon requires a minimum order value of ₹${coupon.min_order}`
      });
    }

    res.json({
      success: true,
      data: {
        coupon,
        summary
      },
      message: `Coupon '${coupon.code}' applied successfully!`
    });
  } catch (err) {
    next(err);
  }
};
