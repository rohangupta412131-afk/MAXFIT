import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import cartRoutes from './cartRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import orderRoutes from './orderRoutes.js';
import tryonRoutes from './tryonRoutes.js';
import sizeRoutes from './sizeRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MAXFIT API v1'
  });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/payments', paymentRoutes);
router.use('/orders', orderRoutes);
router.use('/tryon', tryonRoutes);
router.use('/size', sizeRoutes);
router.use('/admin', adminRoutes);

export default router;
