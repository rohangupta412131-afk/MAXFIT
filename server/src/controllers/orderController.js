import { supabaseAdmin } from '../config/supabase.js';
import { razorpayInstance } from '../config/razorpay.js';
import { invoiceService } from '../services/invoiceService.js';

export const getOrders = async (req, res, next) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: orders || []
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'pending') {
      return res.status(400).json({ success: false, error: 'Invoice not available for unpaid orders' });
    }

    const filePath = `${order.user_id}/${order.id}.pdf`;

    // Try fetching existing signed url
    try {
      const signedUrl = await invoiceService.getInvoiceSignedUrl(filePath);
      return res.json({
        success: true,
        data: { downloadUrl: signedUrl }
      });
    } catch (e) {
      // Re-generate if not yet generated
      console.log('Generating missing invoice PDF on the fly...');
      await invoiceService.createAndUploadInvoice(order, order.items);
      const signedUrl = await invoiceService.getInvoiceSignedUrl(filePath);
      return res.json({
        success: true,
        data: { downloadUrl: signedUrl }
      });
    }
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!['paid', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Order cannot be cancelled in '${order.status}' status.`
      });
    }

    // Restore stock
    for (const item of order.items) {
      if (item.variant_id) {
        await supabaseAdmin.rpc('restore_variant_stock', {
          p_variant_id: item.variant_id,
          p_qty: item.qty
        });
      }
    }

    // Trigger Razorpay refund if payment ID exists
    let refundInfo = null;
    if (order.razorpay_payment_id) {
      try {
        refundInfo = await razorpayInstance.payments.refund(order.razorpay_payment_id, {
          notes: {
            reason: 'User cancelled order',
            orderId: order.id
          }
        });
        console.log(`Razorpay refund issued for order ${order.order_number}:`, refundInfo.id);
      } catch (rzpErr) {
        console.warn('Razorpay refund API call note:', rzpErr.message);
      }
    }

    // Update order status
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'refunded'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      data: updated,
      message: 'Order cancelled successfully. Stock has been restored and refund has been initiated.'
    });
  } catch (err) {
    next(err);
  }
};
