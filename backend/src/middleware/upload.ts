import multer from 'multer';
import { IMAGE_MAX_SIZE } from '../lib/upload';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG and WebP images are allowed.'));
    }
    cb(null, true);
  },
});
