import { supabaseAdmin } from '../config/supabase.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      size,
      color,
      min_price,
      max_price,
      in_stock,
      search,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(id, name, slug), variants:product_variants(id, size, color, stock, sku)', { count: 'exact' })
      .eq('is_active', true);

    // Filter by category slug or ID
    if (category) {
      const isUUID = /^[0-9a-fA-F-]{36}$/.test(category);
      if (isUUID) {
        query = query.eq('category_id', category);
      } else {
        // Resolve category slug
        const { data: catData } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single();
        if (catData) {
          query = query.eq('category_id', catData.id);
        }
      }
    }


    // Price range
    if (min_price) {
      query = query.gte('price', parseFloat(min_price));
    }
    if (max_price) {
      query = query.lte('price', parseFloat(max_price));
    }

    // Search query
    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    // Sorting
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: products, count, error } = await query;
    if (error) throw error;

    // Decorate products with stock calculations
    const decoratedProducts = (products || []).map(p => {
      const totalStock = (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
      return {
        ...p,
        total_stock: totalStock,
        in_stock: totalStock > 0,
        low_stock: totalStock > 0 && totalStock <= 10
      };
    });

    // Filter variants in memory if size/color/in_stock specified
    let filteredProducts = decoratedProducts;

    if (size || color || in_stock === 'true') {
      filteredProducts = filteredProducts.filter(p => {
        if (in_stock === 'true' && !p.in_stock) return false;
        if (!size && !color) return true;
        return p.variants?.some(v => {
          let match = true;
          if (size && v.size !== size) match = false;
          if (color && !v.color.toLowerCase().includes(color.toLowerCase())) match = false;
          return match;
        });
      });
    }

    res.json({
      success: true,
      data: {
        products: filteredProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(id, name, slug, size_type), variants:product_variants(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Size sorting order (both tops and bottoms)
    const sizeOrder = {
      S: 1, M: 2, L: 3, XL: 4, XXL: 5,
      '28': 10, '30': 11, '32': 12, '34': 13, '36': 14, '38': 15
    };
    if (product.variants) {
      product.variants.sort((a, b) => (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99));
    }

    const totalStock = (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
    const enrichedProduct = {
      ...product,
      total_stock: totalStock,
      in_stock: totalStock > 0,
      low_stock: totalStock > 0 && totalStock <= 10
    };

    // Fetch related products
    const { data: related } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, price, mrp, images, garment_image, tryon_enabled')
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .eq('is_active', true)
      .limit(4);

    res.json({
      success: true,
      data: {
        ...enrichedProduct,
        related: related || []
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};
