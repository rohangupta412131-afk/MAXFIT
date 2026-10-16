import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { tryonLimiter } from '../middlewares/rateLimiter.js';
import {
  submitTryon,
  getTryonJob,
  getTryonHistory,
  deleteTryonJob
} from '../controllers/tryonController.js';

const router = Router();

const tryonSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Valid product ID required'),
    personPath: z.string().min(5, 'Valid person upload path required')
  })
});

router.use(requireAuth);

router.post('/', tryonLimiter, validate(tryonSchema), submitTryon);
router.get('/', getTryonHistory);
router.get('/:id', getTryonJob);
router.delete('/:id', deleteTryonJob);

export default router;
