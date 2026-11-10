import { Router } from 'express';
import multer from 'multer';
import { authenticateAdmin, authorizeRole } from '../middlewares/auth.middleware';
import { uploadProductImage } from '../controllers/upload.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    if (!file.mimetype.startsWith('image/')) return done(new Error('Only image files are allowed'));
    done(null, true);
  },
});
router.post('/image', authenticateAdmin, authorizeRole('ADMIN'), upload.single('image'), uploadProductImage);
export default router;
