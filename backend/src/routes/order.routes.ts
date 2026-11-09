import { Router } from 'express';
import {
  createOrder,
  trackOrder,
  getOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatus,
} from '../controllers/order.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { orderCreateSchema, orderStatusSchema } from '../validators/order.validator';

const router = Router();

router.post('/', validate(orderCreateSchema), createOrder);
router.get('/track/:orderNumber', trackOrder);

router.use(authenticateAdmin);
router.get('/admin', getOrdersAdmin);
router.get('/admin/:id', getOrderByIdAdmin);
router.patch('/admin/:id/status', validate(orderStatusSchema), updateOrderStatus);

export default router;