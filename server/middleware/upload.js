import multer from 'multer';
import path from 'path';
import s3Service from '../services/s3Service.js';

// Configure multer for memory storage (files will be uploaded to S3)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer upload instance for S3
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export const uploadProfilePhoto = upload.single('profilePhoto');

// Middleware to upload file to S3 after multer processes it
export const uploadToS3 = async (req, res, next) => {
  try {
    if (req.file) {
      console.log('Uploading file to S3:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Validate file type and size using S3 service
      if (!s3Service.isValidImageType(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only image files are allowed.' });
      }

      if (!s3Service.isValidFileSize(req.file.size)) {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
      }

      // Upload to S3
      const uploadResult = await s3Service.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Add S3 information to request for use in route handlers
      req.s3Upload = {
        url: uploadResult.url,
        key: uploadResult.key,
        fileName: uploadResult.fileName,
        eTag: uploadResult.eTag
      };

      console.log('✅ File uploaded to S3 successfully:', req.s3Upload);
    }

    next();
  } catch (error) {
    console.error('S3 upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file to cloud storage',
      details: error.message
    });
  }
};

// Middleware to handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};