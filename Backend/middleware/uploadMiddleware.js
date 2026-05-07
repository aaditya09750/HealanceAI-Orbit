/**
 * Upload middleware — streams files to Cloudinary instead of local disk.
 *
 * Cloudinary auto-reads credentials from env in this order:
 *   1. CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 *   2. CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 *
 * After upload:
 *   req.file.path     → Cloudinary HTTPS URL (saved in DB as the file path)
 *   req.file.filename → Cloudinary public_id ("healance/uploads/<id>")
 *   req.file.size     → bytes
 *   req.file.mimetype → original mime
 *
 * Local disk uploads are no longer used. Backwards compatibility for
 * already-stored local paths is handled at the read sites
 * (textExtractor.js, reportAnalyzer.js).
 */

import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Cloudinary v1 SDK only auto-detects CLOUDINARY_URL, not the three split
// vars. Read both formats so devs can use whichever they prefer in .env.
if (process.env.CLOUDINARY_URL) {
  // Auto-parsed by the SDK from the URL.
  cloudinary.config();
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';
    // 'auto' → image/video/raw chosen per file (PDFs get previews, images get optimization).
    // 'raw'  → DOCX/DOC → stored as opaque files, no transformations.
    const resourceType = isImage || isPdf ? 'auto' : 'raw';
    return {
      folder: 'healance/uploads',
      resource_type: resourceType,
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      format: ext || undefined,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB default
  },
});

export default upload;
