import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

class S3Service {
  constructor() {
    this.s3Client = null;
    this.bucketName = null;
    this.bucketRegion = null;
    this.environment = null;
    this.profilePhotosFolder = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
      return;
    }

    // Initialize S3 client with configuration
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // S3 bucket configuration
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.bucketRegion = process.env.AWS_REGION || 'us-east-1';

    // Environment-specific folder structure
    this.environment = process.env.NODE_ENV || 'development';
    this.profilePhotosFolder = `${this.environment}/profile-photos`;

    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
    }

    this.initialized = true;
  }

  /**
   * Generate a unique filename for uploaded files
   * @param {string} originalName - Original filename
   * @returns {string} - Unique filename
   */
  generateFileName(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `profile-${timestamp}-${randomString}${ext}`;
  }

  /**
   * Upload a file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} mimeType - File mime type
   * @returns {Promise<Object>} - Upload result with S3 URL and key
   */
  async uploadFile(fileBuffer, originalName, mimeType) {
    this.initialize();
    try {
      const fileName = this.generateFileName(originalName);
      const key = `${this.profilePhotosFolder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        // Removed ACL setting - using bucket policy for public access instead
        Metadata: {
          'original-name': originalName,
          'upload-timestamp': Date.now().toString(),
          'environment': this.environment
        }
      });

      const result = await this.s3Client.send(command);

      // Generate the public URL for the uploaded file
      const publicUrl = `https://${this.bucketName}.s3.${this.bucketRegion}.amazonaws.com/${key}`;

      console.log('✅ File uploaded to S3 successfully:', {
        fileName,
        key,
        publicUrl,
        eTag: result.ETag
      });

      return {
        success: true,
        url: publicUrl,
        key: key,
        fileName: fileName,
        eTag: result.ETag
      };

    } catch (error) {
      console.error('❌ S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} fileKey - S3 object key
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(fileKey) {
    this.initialize();
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      console.log('✅ File deleted from S3:', fileKey);
      return true;

    } catch (error) {
      console.error('❌ S3 delete error:', error);
      // Don't throw error for delete failures - just log them
      return false;
    }
  }

  /**
   * Extract S3 key from a full S3 URL
   * @param {string} url - Full S3 URL
   * @returns {string|null} - S3 key or null if invalid
   */
  extractKeyFromUrl(url) {
    try {
      if (!url || !url.includes('amazonaws.com')) {
        return null;
      }

      // Extract key from URL like: https://bucket.s3.region.amazonaws.com/path/to/file.jpg
      const urlParts = url.split('amazonaws.com/');
      return urlParts.length > 1 ? urlParts[1] : null;

    } catch (error) {
      console.error('Error extracting S3 key from URL:', error);
      return null;
    }
  }

  /**
   * Generate a presigned URL for secure file access (optional, for private files)
   * @param {string} fileKey - S3 object key
   * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} - Presigned URL
   */
  async getPresignedUrl(fileKey, expiresIn = 3600) {
    this.initialize();
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn
      });

      return signedUrl;

    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Validate file type for profile photos
   * @param {string} mimeType - File mime type
   * @returns {boolean} - Whether file type is valid
   */
  isValidImageType(mimeType) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    return allowedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Validate file size
   * @param {number} fileSize - File size in bytes
   * @returns {boolean} - Whether file size is valid
   */
  isValidFileSize(fileSize) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return fileSize <= maxSize;
  }

  /**
   * Get S3 configuration info (for debugging)
   * @returns {Object} - Configuration details
   */
  getConfig() {
    this.initialize();
    return {
      bucketName: this.bucketName,
      bucketRegion: this.bucketRegion,
      environment: this.environment,
      profilePhotosFolder: this.profilePhotosFolder,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    };
  }
}

// Export singleton instance
const s3Service = new S3Service();
export default s3Service;