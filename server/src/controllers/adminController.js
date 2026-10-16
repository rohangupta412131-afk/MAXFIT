import { supabaseAdmin } from '../config/supabase.js';
import { razorpayInstance } from '../config/razorpay.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Orders and Revenue
    const { data: allOrders } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, created_at');

    const paidOrders = (allOrders || []).filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status));
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const ordersToday = (allOrders || []).filter(o => o.created_at.startsWith(todayStr)).length;
    const pendingOrders = (allOrders || []).filter(o => o.status === 'pending').length;

    // 2. Low-stock variants (< 5)
    const { data: lowStockVariants } = await supabaseAdmin
      .from('product_variants')
      .select('id, size, color, stock, sku, product:products(name, slug)')
      .lt('stock', 5)
      .order('stock', { ascending: true });

    // 3. Try-on analytics
    const { data: allTryons } = await supabaseAdmin
      .from('tryon_jobs')
      .select('id, status, created_at');

    const totalTryonJobs = allTryons?.length || 0;
    const successfulTryons = (allTryons || []).filter(j => j.status === 'done').length;
    const tryonSuccessRate = totalTryonJobs > 0 ? Math.round((successfulTryons / totalTryonJobs) * 100) : 100;

    // 4. Sales last 7 days breakdown for charts
    const salesByDate = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      salesByDate[key] = 0;
    }

    paidOrders.forEach(o => {
      const dateKey = o.created_at.slice(0, 10);
      if (salesByDate[dateKey] !== undefined) {
        salesByDate[dateKey] += Number(o.total || 0);
      }
    });

    res.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        ordersToday,
        pendingOrders,
        lowStockAlerts: lowStockVariants || [],
        tryonAnalytics: {
          totalJobs: totalTryonJobs,
          successfulJobs: successfulTryons,
          successRate: `${tryonSuccessRate}%`
        },
        salesChart: Object.entries(salesByDate).map(([date, revenue]) => ({ date, revenue }))
      }
    });
  } catch (err) {
    next(err);
  }
};

// Products Admin CRUD
export const adminGetProducts = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(name), variants:product_variants(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const adminCreateProduct = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      mrp,
      category_id,
      gender = 'unisex',
      fabric,
      care_instructions,
      images = [],
      garment_image,
      garment_des,
      tryon_enabled = true,
      variants = []
    } = req.body;

    // Insert product
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        price,
        mrp,
        category_id,
        gender,
        fabric,
        care_instructions,
        images,
        garment_image,
        garment_des,
        tryon_enabled,
        is_active: true
      })
      .select()
      .single();

    if (prodErr) throw prodErr;

    // Insert initial variants if provided
    if (variants && variants.length > 0) {
      const variantInserts = variants.map(v => ({
        product_id: product.id,
        size: v.size,
        color: v.color,
        sku: v.sku || `${product.slug.toUpperCase().slice(0, 8)}-${v.size}-${v.color.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
        stock: v.stock || 0
      }));
      await supabaseAdmin.from('product_variants').insert(variantInserts);
    }

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: 'Product updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const adminDeleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// Orders Admin
export const adminGetOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: `Order status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

// Coupons Admin CRUD
export const adminGetCoupons = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const adminCreateCoupon = async (req, res, next) => {
  try {
    const { code, type, value, min_order, max_discount, expires_at } = req.body;
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        type,
        value,
        min_order: min_order || 0,
        max_discount: max_discount || null,
        expires_at: expires_at || null,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data, message: 'Coupon created successfully' });
  } catch (err) {
    next(err);
  }
};

export const adminDeleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    next(err);
  }
};
