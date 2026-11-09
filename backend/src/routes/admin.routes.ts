import { Router } from 'express';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} from '../controllers/product.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticateAdmin, authorizeRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { productCreateSchema, productUpdateSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticateAdmin, authorizeRole('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/products', getAllProductsAdmin);
router.post('/products', validate(productCreateSchema), createProduct);
router.put('/products/:id', validate(productUpdateSchema), updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;