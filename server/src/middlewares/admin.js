export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.profile) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.profile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Administrator privileges required'
    });
  }

  next();
};
