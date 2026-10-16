import { supabaseAdmin } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token'
      });
    }

    req.user = user;

    // Fetch profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileErr) {
      console.warn('Profile fetch warning:', profileErr.message);
      // Auto-fallback minimal profile if table row wasn't ready
      req.profile = { id: user.id, role: 'customer', full_name: user.user_metadata?.full_name || '' };
    } else {
      req.profile = profile;
    }

    next();
  } catch (err) {
    next(err);
  }
};

// Optional auth for cart or guest sessions
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        req.user = user;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        req.profile = profile;
      }
    }
    next();
  } catch (err) {
    // Silently continue as guest
    next();
  }
};
