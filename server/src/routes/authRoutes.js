import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/authController.js';

const router = Router();

const profileUpdateSchema = z.object({
  body: z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional(),
    height_cm: z.number().min(50).max(250).optional().nullable(),
    weight_kg: z.number().min(20).max(300).optional().nullable()
  })
});

const addressSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
    line1: z.string().min(3, 'Address line 1 is required'),
    line2: z.string().optional().nullable(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
    is_default: z.boolean().optional()
  })
});

router.get('/profile', requireAuth, getProfile);
router.patch('/profile', requireAuth, authLimiter, validate(profileUpdateSchema), updateProfile);

router.get('/addresses', requireAuth, getAddresses);
router.post('/addresses', requireAuth, validate(addressSchema), addAddress);
router.patch('/addresses/:id', requireAuth, validate(addressSchema), updateAddress);
router.delete('/addresses/:id', requireAuth, deleteAddress);

export default router;
