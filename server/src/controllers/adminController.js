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

export const adminGetProducts = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(id, name, slug), variants:product_variants(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = (data || []).map(p => {
      const totalStock = (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
      return {
        ...p,
        total_stock: totalStock,
        in_stock: totalStock > 0,
        low_stock: totalStock > 0 && totalStock <= 10
      };
    });

    res.json({ success: true, data: enriched });
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
      fabric,
      care_instructions,
      images = [],
      garment_image,
      garment_des,
      tryon_enabled = true,
      is_featured = false,
      is_new = false,
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
        fabric,
        care_instructions,
        images,
        garment_image,
        garment_des,
        tryon_enabled,
        is_featured,
        is_new,
        is_active: true
      })
      .select()
      .single();

    if (prodErr) throw prodErr;

    // Insert initial variants if provided, or auto-generate defaults if none provided
    let finalVariants = variants;
    if (!finalVariants || finalVariants.length === 0) {
      const { data: cat } = await supabaseAdmin.from('categories').select('size_type').eq('id', category_id).single();
      const sizes = cat?.size_type === 'bottom' ? ['28', '30', '32', '34', '36', '38'] : ['S', 'M', 'L', 'XL', 'XXL'];
      finalVariants = sizes.map(s => ({
        size: s,
        color: 'Standard',
        stock: 10
      }));
    }

    const variantInserts = finalVariants.map(v => ({
      product_id: product.id,
      size: v.size,
      color: v.color || 'Standard',
      sku: v.sku || `${product.slug.toUpperCase().slice(0, 8)}-${v.size}-${(v.color || 'STD').slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      stock: Math.max(0, parseInt(v.stock, 10) || 0)
    }));
    await supabaseAdmin.from('product_variants').insert(variantInserts);

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
    const {
      name,
      slug,
      description,
      price,
      mrp,
      category_id,
      fabric,
      care_instructions,
      images,
      garment_image,
      garment_des,
      tryon_enabled,
      is_featured,
      is_new,
      is_active,
      variants
    } = req.body;

    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (slug !== undefined) allowedUpdates.slug = slug;
    if (description !== undefined) allowedUpdates.description = description;
    if (price !== undefined) allowedUpdates.price = Number(price);
    if (mrp !== undefined) allowedUpdates.mrp = Number(mrp);
    if (category_id !== undefined) allowedUpdates.category_id = category_id;
    if (fabric !== undefined) allowedUpdates.fabric = fabric;
    if (care_instructions !== undefined) allowedUpdates.care_instructions = care_instructions;
    if (images !== undefined) allowedUpdates.images = images;
    if (garment_image !== undefined) allowedUpdates.garment_image = garment_image;
    if (garment_des !== undefined) allowedUpdates.garment_des = garment_des;
    if (tryon_enabled !== undefined) allowedUpdates.tryon_enabled = Boolean(tryon_enabled);
    if (is_featured !== undefined) allowedUpdates.is_featured = Boolean(is_featured);
    if (is_new !== undefined) allowedUpdates.is_new = Boolean(is_new);
    if (is_active !== undefined) allowedUpdates.is_active = Boolean(is_active);

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update(allowedUpdates)
      .eq('id', id)
      .select('*, category:categories(id, name, slug)')
      .single();

    if (error) throw error;

    // Update variant stock if passed
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (v.id) {
          await supabaseAdmin
            .from('product_variants')
            .update({ stock: Math.max(0, parseInt(v.stock, 10) || 0) })
            .eq('id', v.id)
            .eq('product_id', id);
        } else if (v.size) {
          await supabaseAdmin
            .from('product_variants')
            .insert({
              product_id: id,
              size: v.size,
              color: v.color || 'Standard',
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
              sku: v.sku || `${(updated.slug || 'PROD').toUpperCase().slice(0, 8)}-${v.size}-${(v.color || 'STD').slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`
            });
        }
      }
    }

    res.json({ success: true, data: updated, message: 'Product updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const adminUpdateVariantStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative integer' });
    }

    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .update({ stock: parsedStock })
      .eq('id', id)
      .select('*, product:products(id, name, slug)')
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: 'Stock updated successfully' });
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

export const adminUploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const { category_slug = 'catalog' } = req.body;
    const originalExt = req.file.originalname?.split('.').pop() || 'jpg';
    const cleanExt = originalExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${category_slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${cleanExt}`;

    const { data, error } = await supabaseAdmin.storage
      .from('products')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype || 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(fileName);

    res.json({
      success: true,
      url: publicUrlData.publicUrl,
      data: {
        url: publicUrlData.publicUrl,
        fileName
      },
      message: 'Garment image uploaded successfully'
    });
  } catch (err) {
    next(err);
  }
};
