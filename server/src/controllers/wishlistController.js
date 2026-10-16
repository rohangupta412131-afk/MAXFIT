import { supabaseAdmin } from '../config/supabase.js';

export const getWishlist = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('wishlist_items')
      .select(`
        id,
        created_at,
        product:products (
          id,
          name,
          slug,
          price,
          mrp,
          images,
          garment_image,
          tryon_enabled,
          category:categories(name),
          variants:product_variants(id, size, color, stock)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data ? data.map(item => item.product).filter(Boolean) : []
    });
  } catch (err) {
    next(err);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    // Check if item exists in wishlist
    const { data: existing } = await supabaseAdmin
      .from('wishlist_items')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('wishlist_items')
        .delete()
        .eq('id', existing.id);

      return res.json({
        success: true,
        action: 'removed',
        message: 'Removed from wishlist'
      });
    } else {
      await supabaseAdmin
        .from('wishlist_items')
        .insert({
          user_id: req.user.id,
          product_id
        });

      return res.json({
        success: true,
        action: 'added',
        message: 'Added to wishlist'
      });
    }
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const { error } = await supabaseAdmin
      .from('wishlist_items')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', productId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (err) {
    next(err);
  }
};
