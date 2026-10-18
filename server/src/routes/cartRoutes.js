import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  applyCoupon,
  getBuyNowPreview
} from '../controllers/cartController.js';

const router = Router();

const addCartSchema = z.object({
  body: z.object({
    variant_id: z.string().uuid('Invalid variant ID'),
    qty: z.number().int().min(1).default(1)
  })
});

const updateCartSchema = z.object({
  body: z.object({
    qty: z.number().int().min(0)
  })
});

const couponSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Enter a valid coupon code')
  })
});

router.use(requireAuth);

router.get('/', getCart);
router.get('/buy-now-preview', getBuyNowPreview);
router.post('/', validate(addCartSchema), addToCart);
router.patch('/:id', validate(updateCartSchema), updateCartItem);
router.delete('/:id', removeFromCart);
router.post('/apply-coupon', validate(couponSchema), applyCoupon);

export default router;
