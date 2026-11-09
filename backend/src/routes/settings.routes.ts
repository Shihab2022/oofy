import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { settingsUpdateSchema } from '../validators/settings.validator';

const router = Router();

router.get('/', getSettings);
router.use(authenticateAdmin);
router.put('/', validate(settingsUpdateSchema), updateSettings);

export default router;