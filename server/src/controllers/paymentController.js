import crypto from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { razorpayInstance } from '../config/razorpay.js';
import { computeCartSummary } from './cartController.js';
import { invoiceService } from '../services/invoiceService.js';

export const createPaymentOrder = async (req, res, next) => {
  try {
    const { addressId, couponCode, buyNowVariantId, buyNowQty = 1 } = req.body;

    // Validate address
    const { data: address, error: addrErr } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', req.user.id)
      .single();

    if (addrErr || !address) {
      return res.status(400).json({ success: false, error: 'Please select a valid delivery address' });
    }

    let orderItemsData = [];
    let itemsForSummary = [];

    if (buyNowVariantId) {
      // Direct Buy Now flow
      const { data: variant, error: varErr } = await supabaseAdmin
        .from('product_variants')
        .select('*, product:products(*)')
        .eq('id', buyNowVariantId)
        .single();

      if (varErr || !variant || variant.stock < buyNowQty) {
        return res.status(400).json({ success: false, error: 'Selected variant is out of stock' });
      }

      orderItemsData.push({
        variant_id: variant.id,
        product_name: variant.product.name,
        size: variant.size,
        color: variant.color,
        qty: buyNowQty,
        unit_price: Number(variant.product.price),
        image: variant.product.images?.[0] || variant.product.garment_image
      });

      itemsForSummary.push({
        qty: buyNowQty,
        variant: {
          product: { price: Number(variant.product.price) }
        }
      });
    } else {
      // Cart checkout flow
      const { data: cartItems, error: cartErr } = await supabaseAdmin
        .from('cart_items')
        .select(`
          id,
          qty,
          variant:product_variants (
            id,
            size,
            color,
            stock,
            product:products (
              id,
              name,
              price,
              images,
              garment_image
            )
          )
        `)
        .eq('user_id', req.user.id);

      if (cartErr || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ success: false, error: 'Your bag is empty' });
      }

      // Check stock for all items
      for (const item of cartItems) {
        if (!item.variant || item.variant.stock < item.qty) {
          return res.status(400).json({
            success: false,
            error: `Item "${item.variant?.product?.name || 'Selected item'}" (${item.variant?.size}) is out of stock or requested quantity exceeds available stock.`
          });
        }

        orderItemsData.push({
          variant_id: item.variant.id,
          product_name: item.variant.product.name,
          size: item.variant.size,
          color: item.variant.color,
          qty: item.qty,
          unit_price: Number(item.variant.product.price),
          image: item.variant.product.images?.[0] || item.variant.product.garment_image
        });

        itemsForSummary.push(item);
      }
    }

    // Coupon validation if present
    let appliedCoupon = null;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon && (!coupon.expires_at || new Date(coupon.expires_at) >= new Date())) {
        appliedCoupon = coupon;
      }
    }

    // Compute totals strictly on server
    const summary = computeCartSummary(itemsForSummary, appliedCoupon);

    // Create DB order row in 'pending' status
    const { data: newOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: req.user.id,
        status: 'pending',
        subtotal: summary.subtotal,
        discount: summary.discount,
        shipping_fee: summary.shippingFee,
        tax: summary.gstBreakdown.totalTax,
        total: summary.total,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        shipping_address: address,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert order items
    const itemsToInsert = orderItemsData.map(item => ({
      ...item,
      order_id: newOrder.id
    }));

    await supabaseAdmin.from('order_items').insert(itemsToInsert);

    // Create Razorpay order (amount in paise)
    const amountInPaise = Math.round(summary.total * 100);
    const rzpOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: newOrder.id.slice(0, 30),
      notes: {
        orderId: newOrder.id,
        userId: req.user.id
      }
    });

    // Update order with razorpay_order_id
    await supabaseAdmin
      .from('orders')
      .update({ razorpay_order_id: rzpOrder.id })
      .eq('id', newOrder.id);

    res.status(200).json({
      success: true,
      data: {
        orderId: newOrder.id,
        orderNumber: newOrder.order_number,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: 'INR',
        keyId: env.RZP_KEY_ID,
        summary
      }
    });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing payment verification credentials' });
    }

    // 1. Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .eq('user_id', req.user.id)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Idempotent return if already paid
    if (order.status === 'paid' || order.status === 'processing') {
      return res.json({
        success: true,
        data: {
          orderNumber: order.order_number,
          status: order.status
        },
        message: 'Payment already verified'
      });
    }

    // 2. Timing-safe HMAC SHA256 Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', env.RZP_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isMatch) {
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);

      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    // 3. Atomically decrement stock
    for (const item of order.items) {
      if (item.variant_id) {
        const { data: stockDecremented, error: rpcErr } = await supabaseAdmin.rpc('decrement_variant_stock', {
          p_variant_id: item.variant_id,
          p_qty: item.qty
        });

        if (rpcErr || stockDecremented === false) {
          console.error(`Stock decrement failed for variant ${item.variant_id}`);
          // Mark refund pending
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'refunded',
              payment_status: 'stock_exhausted_refund_initiated'
            })
            .eq('id', orderId);

          return res.status(400).json({
            success: false,
            error: 'Stock ran out during payment. A full refund has been initiated to your account.'
          });
        }
      }
    }

    // 4. Mark order as paid
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'captured',
        razorpay_payment_id
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 5. Clear cart for user
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    // 6. Asynchronously trigger PDF invoice generation
    invoiceService.createAndUploadInvoice(updatedOrder, order.items).catch(err => {
      console.error('[Invoice Generation Error]', err);
    });

    res.json({
      success: true,
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        total: updatedOrder.total
      },
      message: 'Payment verified successfully!'
    });
  } catch (err) {
    next(err);
  }
};

export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = env.RZP_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return res.status(400).send('Webhook signature missing');
    }

    const rawBody = req.body.toString();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[Webhook] Signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const rzpOrderId = payment.order_id;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('razorpay_order_id', rzpOrderId)
        .single();

      if (order && order.status === 'pending') {
        // Decrement stock and mark paid
        for (const item of order.items) {
          if (item.variant_id) {
            await supabaseAdmin.rpc('decrement_variant_stock', {
              p_variant_id: item.variant_id,
              p_qty: item.qty
            });
          }
        }

        await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'captured',
            razorpay_payment_id: payment.id
          })
          .eq('id', order.id);

        invoiceService.createAndUploadInvoice(order, order.items).catch(() => {});
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const rzpOrderId = payment.order_id;
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('razorpay_order_id', rzpOrderId);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Webhook error]:', err);
    res.status(500).send('Webhook handler error');
  }
};

export const retryPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Order is already in '${order.status}' status.` });
    }

    // Verify stock is still available for all items
    for (const item of order.items) {
      if (item.variant_id) {
        const { data: variant } = await supabaseAdmin
          .from('product_variants')
          .select('stock, size')
          .eq('id', item.variant_id)
          .single();

        if (!variant || variant.stock < item.qty) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${item.product_name} (Size: ${variant?.size || item.size}). Available: ${variant?.stock || 0}`
          });
        }
      }
    }

    // Check or recreate Razorpay order
    let rzpOrderId = order.razorpay_order_id;
    const amountInPaise = Math.round(Number(order.total) * 100);

    try {
      if (rzpOrderId) {
        const existingRzp = await razorpayInstance.orders.fetch(rzpOrderId);
        if (existingRzp.status === 'paid') {
          return res.status(400).json({ success: false, error: 'Order is already paid on Razorpay' });
        }
      } else {
        throw new Error('Create new rzp order');
      }
    } catch {
      const newRzp = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.id.slice(0, 30),
        notes: {
          orderId: order.id,
          userId: req.user.id
        }
      });
      rzpOrderId = newRzp.id;
      await supabaseAdmin.from('orders').update({ razorpay_order_id: rzpOrderId }).eq('id', order.id);
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).single();

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        razorpayOrderId: rzpOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: env.RZP_KEY_ID,
        user: {
          name: profile?.full_name || order.shipping_address?.name || 'Customer',
          email: req.user.email,
          phone: profile?.phone || order.shipping_address?.phone || ''
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
