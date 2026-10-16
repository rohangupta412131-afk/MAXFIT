import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getWishlist, toggleWishlist, removeFromWishlist } from '../controllers/wishlistController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getWishlist);
router.post('/', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
