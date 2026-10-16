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

    // Fetch size chart entries for this category
    const { data: chart } = await supabaseAdmin
      .from('size_chart')
      .select('*')
      .eq('category_id', categoryId);

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    let baseSizeIndex = 2; // Default to 'M'
    let confidence = 'medium';
    let explanation = '';

    // If chest is provided, match directly
    if (chest_cm && chart && chart.length > 0) {
      const chestNum = Number(chest_cm);
      let closestDiff = Infinity;
      let matchedSize = 'M';

      for (const row of chart) {
        if (row.chest_cm) {
          const diff = Math.abs(row.chest_cm - chestNum);
          if (diff < closestDiff) {
            closestDiff = diff;
            matchedSize = row.size;
          }
        }
      }
      baseSizeIndex = sizes.indexOf(matchedSize);
      confidence = 'high';
      explanation = `Based on your chest measurement of ${chestNum} cm.`;
    } else {
      // BMI and Height heuristic
      const bmi = weight / Math.pow(height / 100, 2);

      if (bmi < 18.5) {
        baseSizeIndex = height > 175 ? 1 : 0; // S or XS
        explanation = 'Calculated for a lean, slender build.';
      } else if (bmi < 22) {
        baseSizeIndex = height > 180 ? 2 : 1; // M or S
        explanation = 'Calculated for a lean-to-average athletic build.';
      } else if (bmi < 25) {
        baseSizeIndex = height > 182 ? 3 : 2; // L or M
        explanation = 'Calculated for a standard proportioned build.';
      } else if (bmi < 28) {
        baseSizeIndex = height > 185 ? 4 : 3; // XL or L
        explanation = 'Calculated for a fuller, broader athletic build.';
      } else {
        baseSizeIndex = 5; // XXL
        explanation = 'Calculated for a heavy, broad build.';
      }
    }

    // Apply fit preference
    if (fit_preference === 'slim') {
      baseSizeIndex = Math.max(0, baseSizeIndex - 1);
      explanation += ' Adjusted down one size for a snug, tapered fit.';
    } else if (fit_preference === 'relaxed') {
      baseSizeIndex = Math.min(sizes.length - 1, baseSizeIndex + 1);
      explanation += ' Sized up for an oversized, relaxed silhouette.';
    }

    const recommendedSize = sizes[baseSizeIndex];

    // Check variant stock for this specific product
    let inStock = true;
    if (productId) {
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('size, stock')
        .eq('product_id', productId)
        .eq('size', recommendedSize);

      if (variants && variants.length > 0) {
        const totalStockForSize = variants.reduce((sum, v) => sum + v.stock, 0);
        inStock = totalStockForSize > 0;
      }
    }

    res.json({
      success: true,
      data: {
        recommendedSize,
        confidence,
        explanation,
        inStock,
        fitPreference: fit_preference
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getSizeChart = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('size_chart')
      .select('*')
      .eq('category_id', categoryId);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
};
