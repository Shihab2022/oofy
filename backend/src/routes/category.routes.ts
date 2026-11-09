import { Router } from 'express';
import {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getCategories);

router.use(authenticateAdmin);
router.get('/admin/all', getAllCategoriesAdmin);
router.post('/admin', createCategory);
router.put('/admin/:id', updateCategory);
router.delete('/admin/:id', deleteCategory);

export default router;