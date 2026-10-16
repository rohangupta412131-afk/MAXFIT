import { supabaseAdmin } from '../config/supabase.js';

export const getProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, height_cm, weight_kg } = req.body;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...(full_name !== undefined && { full_name }),
        ...(phone !== undefined && { phone }),
        ...(height_cm !== undefined && { height_cm: height_cm ? Number(height_cm) : null }),
        ...(weight_kg !== undefined && { weight_kg: weight_kg ? Number(weight_kg) : null }),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { name, phone, line1, line2, city, state, pincode, is_default } = req.body;

    if (is_default) {
      // Clear previous default
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: req.user.id,
        name,
        phone,
        line1,
        line2: line2 || '',
        city,
        state,
        pincode,
        is_default: !!is_default
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Address saved successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, line1, line2, city, state, pincode, is_default } = req.body;

    if (is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update({
        name,
        phone,
        line1,
        line2,
        city,
        state,
        pincode,
        ...(is_default !== undefined && { is_default })
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Address updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
