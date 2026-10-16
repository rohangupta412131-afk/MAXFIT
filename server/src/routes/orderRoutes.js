import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getOrders,
  getOrderById,
  getOrderInvoice,
  cancelOrder
} from '../controllers/orderController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/invoice', getOrderInvoice);
router.post('/:id/cancel', cancelOrder);

export default router;
