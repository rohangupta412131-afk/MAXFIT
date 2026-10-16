import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit each IP to 30 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many payment requests, please try again shortly.'
  }
});

export const tryonLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // 10 requests per 10 minutes per IP/user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Virtual try-on quota exceeded (max 10 requests per 10 minutes). Please wait before trying another fit.'
  }
});
