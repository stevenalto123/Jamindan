const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jamindan_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'],
    transformation: [{ width: 800, crop: 'limit' }] // Resize huge images automatically to save space
  }
});

/** Shared mobile-friendly image uploader supporting JPG, PNG, GIF, WEBP & iPhone HEIC/HEIF. */
const createImageUpload = (maxSizeMB = 5) => multer({
  storage,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(jpe?g|png|gif|webp|heic|heif)$/i;
    const allowedMime = /^image\/(jpe?g|png|gif|webp|heic|heif)$/i;
    const ext = path.extname(file.originalname || '');
    const hasValidExt = allowedExt.test(ext);
    const hasValidMime = allowedMime.test(file.mimetype || '');

    if (
      (hasValidMime && (hasValidExt || !ext)) ||
      ((!file.mimetype || file.mimetype === 'application/octet-stream') && hasValidExt)
    ) {
      return cb(null, true);
    }
    cb(new Error(`Only image files (JPG, PNG, WEBP, HEIC) up to ${maxSizeMB}MB are allowed.`));
  }
});

module.exports = { cloudinary, storage, createImageUpload };
