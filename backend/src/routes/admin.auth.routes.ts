import { Router } from 'express';
import { adminLogin, adminLogout, adminMe } from '../controllers/auth.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { adminLoginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validate(adminLoginSchema), adminLogin);
router.post('/logout', adminLogout);
router.get('/me', authenticateAdmin, adminMe);

export default router;