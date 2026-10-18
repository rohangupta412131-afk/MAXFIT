import { supabaseAdmin } from '../config/supabase.js';

export const recommendSize = async (req, res, next) => {
  try {
    const {
      categoryId,
      productId,
      height_cm,
      weight_kg,
      chest_cm,
      waist_cm,
      fit_preference = 'regular', // 'slim' | 'regular' | 'relaxed'
      saveToProfile = false
    } = req.body;

    if (!height_cm || !weight_kg) {
      return res.status(400).json({ success: false, error: 'Height and weight are required for size recommendation' });
    }

    const height = Number(height_cm);
    const weight = Number(weight_kg);

    // Save to user profile if requested and user is authenticated
    if (saveToProfile && req.user) {
      await supabaseAdmin
        .from('profiles')
        .update({ height_cm: height, weight_kg: weight })
        .eq('id', req.user.id);
    }

    // Determine if category is bottom or top
    let sizeType = 'top';
    let catData = null;
    if (categoryId) {
      const isUUID = /^[0-9a-fA-F-]{36}$/.test(categoryId);
      const query = supabaseAdmin.from('categories').select('id, name, slug, size_type');
      const { data } = isUUID ? await query.eq('id', categoryId).single() : await query.eq('slug', categoryId).single();
      catData = data;
      if (catData?.size_type) {
        sizeType = catData.size_type;
      }
    } else if (productId) {
      const { data: p } = await supabaseAdmin
        .from('products')
        .select('category:categories(size_type)')
        .eq('id', productId)
        .single();
      if (p?.category?.size_type) {
        sizeType = p.category.size_type;
      }
    }

    const isBottom = sizeType === 'bottom';
    const topSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const bottomSizes = ['28', '30', '32', '34', '36', '38'];
    const sizes = isBottom ? bottomSizes : topSizes;

    let baseSizeIndex = isBottom ? 2 : 1; // Default to '32' for bottoms, 'M' for tops
    let confidence = 'medium';
    let explanation = '';

    const bmi = weight / Math.pow(height / 100, 2);

    if (isBottom) {
      // Bottoms logic: waist-based or fallback to height/weight BMI
      if (waist_cm) {
        const waistNum = Number(waist_cm);
        // Map waist cm to standard inches: 28 (~71cm), 30 (~76cm), 32 (~81cm), 34 (~86cm), 36 (~91cm), 38 (~97cm)
        if (waistNum < 74) baseSizeIndex = 0; // 28
        else if (waistNum < 79) baseSizeIndex = 1; // 30
        else if (waistNum < 84) baseSizeIndex = 2; // 32
        else if (waistNum < 89) baseSizeIndex = 3; // 34
        else if (waistNum < 95) baseSizeIndex = 4; // 36
        else baseSizeIndex = 5; // 38
        confidence = 'high';
        explanation = `Calculated from your waist measurement of ${waistNum} cm.`;
      } else {
        // Fallback BMI heuristic for bottoms
        if (bmi < 20.5) {
          baseSizeIndex = height > 178 ? 1 : 0; // 30 or 28
          explanation = 'Calculated for a slim, slender waist.';
        } else if (bmi < 23.5) {
          baseSizeIndex = height > 180 ? 2 : 1; // 32 or 30
          explanation = 'Calculated for a lean, athletic waist.';
        } else if (bmi < 26.5) {
          baseSizeIndex = height > 182 ? 3 : 2; // 34 or 32
          explanation = 'Calculated for a standard proportioned build.';
        } else if (bmi < 29.5) {
          baseSizeIndex = height > 185 ? 4 : 3; // 36 or 34
          explanation = 'Calculated for a broader, muscular build.';
        } else {
          baseSizeIndex = 5; // 38
          explanation = 'Calculated for a fuller, relaxed waist.';
        }
      }
    } else {
      // Tops logic: chest-based or fallback to height/weight BMI
      if (chest_cm) {
        const chestNum = Number(chest_cm);
        if (chestNum < 92) baseSizeIndex = 0; // S
        else if (chestNum < 100) baseSizeIndex = 1; // M
        else if (chestNum < 108) baseSizeIndex = 2; // L
        else if (chestNum < 116) baseSizeIndex = 3; // XL
        else baseSizeIndex = 4; // XXL
        confidence = 'high';
        explanation = `Calculated from your chest measurement of ${chestNum} cm.`;
      } else {
        if (bmi < 20.5) {
          baseSizeIndex = 0; // S
          explanation = 'Calculated for a lean, slender build.';
        } else if (bmi < 23.5) {
          baseSizeIndex = height > 180 ? 2 : 1; // L or M
          explanation = 'Calculated for a lean-to-average athletic build.';
        } else if (bmi < 26.5) {
          baseSizeIndex = height > 182 ? 3 : 2; // XL or L
          explanation = 'Calculated for a standard proportioned build.';
        } else if (bmi < 29.5) {
          baseSizeIndex = 3; // XL
          explanation = 'Calculated for a broad athletic build.';
        } else {
          baseSizeIndex = 4; // XXL
          explanation = 'Calculated for a heavy, broad build.';
        }
      }
    }

    // Apply fit preference
    if (fit_preference === 'slim') {
      baseSizeIndex = Math.max(0, baseSizeIndex - 1);
      explanation += ' Sized down for a snug, fitted silhouette.';
    } else if (fit_preference === 'relaxed') {
      baseSizeIndex = Math.min(sizes.length - 1, baseSizeIndex + 1);
      explanation += ' Sized up for a relaxed, easy drape.';
    }

    let recommendedSize = sizes[baseSizeIndex];
    let inStock = true;
    let alternativeSize = null;

    // Check variant stock and suggest nearest in-stock alternative if needed
    if (productId) {
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('size, stock')
        .eq('product_id', productId);

      if (variants && variants.length > 0) {
        const stockMap = new Map();
        variants.forEach(v => {
          stockMap.set(v.size, (stockMap.get(v.size) || 0) + (v.stock || 0));
        });

        const recStock = stockMap.get(recommendedSize) || 0;
        inStock = recStock > 0;

        if (!inStock) {
          // Find nearest size with stock > 0
          let minDistance = Infinity;
          let nearestSize = null;

          sizes.forEach((sz, idx) => {
            if ((stockMap.get(sz) || 0) > 0) {
              const dist = Math.abs(idx - baseSizeIndex);
              if (dist < minDistance) {
                minDistance = dist;
                nearestSize = sz;
              }
            }
          });

          if (nearestSize) {
            alternativeSize = nearestSize;
            explanation += ` Note: Size ${recommendedSize} is currently sold out. Nearest in-stock alternative is Size ${nearestSize}.`;
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        recommendedSize,
        confidence,
        explanation,
        inStock,
        alternativeSize,
        fitPreference: fit_preference,
        sizeType
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getSizeChart = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const isUUID = /^[0-9a-fA-F-]{36}$/.test(categoryId);
    let catId = categoryId;
    if (!isUUID) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', categoryId)
        .single();
      if (cat) catId = cat.id;
    }

    const { data, error } = await supabaseAdmin
      .from('size_chart')
      .select('*')
      .eq('category_id', catId);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
};
