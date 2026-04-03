import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';

// Initialize Cloudinary with credentials from environment
cloudinary.config({
  cloudinary_url: config.cloudinaryUrl
});

export default cloudinary;
