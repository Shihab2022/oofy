import { Router } from 'express';
import { productsRouter } from './public/products';
import { categoriesRouter } from './public/categories';
import { ordersRouter } from './public/orders';
import { trackRouter } from './public/track';
import { contactRouter } from './public/contact';
import { settingsRouter } from './public/settings';
import { authRouter } from './admin/auth';
import { adminProductsRouter } from './admin/products';
import { categoriesRouter as adminCategoriesRouter } from './admin/categories';
import { adminOrdersRouter } from './admin/orders';
import { dashboardRouter } from './admin/dashboard';
import { settingsRouter as adminSettingsRouter } from './admin/settings';

const router = Router();

router.use('/products', productsRouter);
router.use('/categories', categoriesRouter);
router.use('/orders', ordersRouter);
router.use('/orders/track', trackRouter);
router.use('/contact', contactRouter);
router.use('/store/settings', settingsRouter);

router.use('/admin/auth', authRouter);
router.use('/admin/products', adminProductsRouter);
router.use('/admin/categories', adminCategoriesRouter);
router.use('/admin/orders', adminOrdersRouter);
router.use('/admin/dashboard', dashboardRouter);
router.use('/admin/settings', adminSettingsRouter);

export default router;
