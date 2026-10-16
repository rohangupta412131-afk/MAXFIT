import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { paymentLimiter } from '../middlewares/rateLimiter.js';
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook
} from '../controllers/paymentController.js';

const router = Router();

const createOrderSchema = z.object({
  body: z.object({
    addressId: z.string().uuid('Valid address ID required'),
    couponCode: z.string().optional().nullable(),
    buyNowVariantId: z.string().uuid().optional().nullable(),
    buyNowQty: z.number().int().min(1).default(1)
  })
});

const verifySchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string()
  })
});

// Webhook endpoint (signature verified internally from raw body)
router.post('/webhook', handleRazorpayWebhook);

// Protected payment endpoints
router.post('/create-order', requireAuth, paymentLimiter, validate(createOrderSchema), createPaymentOrder);
router.post('/verify', requireAuth, paymentLimiter, validate(verifySchema), verifyPayment);

export default router;
