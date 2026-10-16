import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { recommendSize, getSizeChart } from '../controllers/sizeController.js';

const router = Router();

const recommendSchema = z.object({
  body: z.object({
    categoryId: z.string().optional(),
    productId: z.string().optional(),
    height_cm: z.number().min(100).max(250),
    weight_kg: z.number().min(30).max(250),
    chest_cm: z.number().min(50).max(200).optional().nullable(),
    waist_cm: z.number().min(40).max(200).optional().nullable(),
    fit_preference: z.enum(['slim', 'regular', 'relaxed']).default('regular'),
    saveToProfile: z.boolean().default(false)
  })
});

router.post('/recommend', optionalAuth, validate(recommendSchema), recommendSize);
router.get('/chart/:categoryId', getSizeChart);

export default router;
