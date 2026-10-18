import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/admin.js';
import {
  getDashboardMetrics,
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminUpdateVariantStock,
  adminDeleteProduct,
  adminUploadImage,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetCoupons,
  adminCreateCoupon,
  adminDeleteCoupon
} from '../controllers/adminController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

// Protect all admin routes
router.use(requireAuth, requireAdmin);

router.get('/metrics', getDashboardMetrics);

// Image Upload to Supabase Products Bucket
router.post('/upload-image', upload.single('image'), adminUploadImage);

// Products & Stock
router.get('/products', adminGetProducts);
router.post('/products', adminCreateProduct);
router.put('/products/:id', adminUpdateProduct);
router.delete('/products/:id', adminDeleteProduct);
router.patch('/variants/:id/stock', adminUpdateVariantStock);

// Orders
router.get('/orders', adminGetOrders);
router.patch('/orders/:id/status', adminUpdateOrderStatus);

// Coupons
router.get('/coupons', adminGetCoupons);
router.post('/coupons', adminCreateCoupon);
router.delete('/coupons/:id', adminDeleteCoupon);

export default router;
