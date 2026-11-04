import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateImage(file: Express.Multer.File): void {
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    throw new Error('Only JPEG, PNG and WebP images are allowed.');
  }
  if (file.size > IMAGE_MAX_SIZE) {
    throw new Error('Image must be smaller than 5 MB.');
  }
}

export function uploadImage(
  buffer: Buffer,
  options: { folder?: string; publicId?: string },
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? 'oofy/products',
        public_id: options.publicId,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as { secure_url: string; public_id: string });
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

export function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
