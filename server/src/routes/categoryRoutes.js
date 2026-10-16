import { Router } from 'express';
import { getCategories } from '../controllers/productController.js';

const router = Router();

router.get('/', getCategories);

export default router;
