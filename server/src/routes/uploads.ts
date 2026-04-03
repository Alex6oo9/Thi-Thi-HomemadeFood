import express, { Request, Response } from 'express';
import { uploadImage } from '../middleware/upload';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import { config } from '../config/env';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { fileTypeFromBuffer } from 'file-type';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Helper function to convert buffer to stream
const bufferToStream = (buffer: Buffer): Readable => {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but you can noop it
  readable.push(buffer);
  readable.push(null);
  return readable;
};

// Validate image file using magic bytes
const validateImageFile = async (buffer: Buffer): Promise<void> => {
  const type = await fileTypeFromBuffer(buffer);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!type || !allowedTypes.includes(type.mime)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }
};

// Upload image to Cloudinary
router.post('/image', uploadLimiter, isAuthenticated, isAdmin, uploadImage, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate actual file content using magic bytes
    try {
      await validateImageFile(req.file.buffer);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    // Check if Cloudinary is configured
    if (!config.cloudinaryUrl) {
      return res.status(500).json({ error: 'Cloudinary is not configured. Please set CLOUDINARY_URL in environment variables.' });
    }

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: config.cloudinaryFolder,
          upload_preset: config.cloudinaryUploadPreset || undefined,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      bufferToStream(req.file!.buffer).pipe(uploadStream);
    });

    const result = await uploadPromise;

    res.json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image to Cloudinary',
      details: error.message || 'Unknown error'
    });
  }
});

export default router;