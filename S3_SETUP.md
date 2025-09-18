# AWS S3 Setup Guide for Profile Photos

This guide explains how to set up AWS S3 for storing profile photos in both development and production environments.

## Overview

The application now uses AWS S3 for storing profile photos instead of local file system storage. This provides:

- ✅ **Scalable Storage**: No server disk space limitations
- ✅ **Global CDN**: Fast image delivery worldwide
- ✅ **Reliability**: 99.999999999% durability
- ✅ **Environment Separation**: Development and production use separate folders
- ✅ **Security**: Proper access controls and validation

## AWS S3 Configuration

### 1. Create an S3 Bucket

1. Log in to the [AWS Console](https://console.aws.amazon.com/)
2. Navigate to S3 service
3. Click "Create bucket"
4. Configure your bucket:
   ```
   Bucket name: your-app-name-uploads (e.g., appoint-zenith-uploads)
   Region: us-east-1 (or your preferred region)
   Public access: Allow public read access for uploaded images
   ```

### 2. Configure Bucket for Public Access

#### Option A: Using Bucket Policy (Recommended)

1. Go to your bucket in the S3 console
2. Click on the "Permissions" tab
3. Under "Block public access (bucket settings)", click "Edit"
4. Uncheck "Block all public access" and save changes
5. Under "Bucket policy", add this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

#### Option B: If ACLs are Disabled (Current Setup)

If your bucket has ACLs disabled (default for newer buckets), the bucket policy above is sufficient. The application has been configured to work without ACL settings.

### 3. Create IAM User for the Application

1. Go to IAM service in AWS Console
2. Create a new user with programmatic access
3. Attach this policy to the user:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

4. Save the Access Key ID and Secret Access Key

## Environment Variables

Add these variables to your environment files:

### Development (.env)
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-development-access-key
AWS_SECRET_ACCESS_KEY=your-development-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
NODE_ENV=development
```

### Production
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-production-access-key
AWS_SECRET_ACCESS_KEY=your-production-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
NODE_ENV=production
```

## File Organization

The S3 service automatically organizes files by environment:

```
your-bucket-name/
├── development/
│   └── profile-photos/
│       ├── profile-1234567890-abc123.jpg
│       └── profile-1234567891-def456.png
└── production/
    └── profile-photos/
        ├── profile-1234567892-ghi789.jpg
        └── profile-1234567893-jkl012.webp
```

## Migration from Local Storage

If you have existing local profile photos, use the migration script:

```bash
# Navigate to server directory
cd server

# Run the migration script
node scripts/migratePhotosToS3.js
```

The script will:
1. Find all providers with local photo paths
2. Upload photos to S3
3. Update database records with S3 URLs
4. Provide a detailed migration report

## API Changes

### Upload Endpoint
```javascript
// POST /api/provider/profile (multipart/form-data)
// profilePhoto field now uploads directly to S3

// Response includes S3 URL:
{
  "provider": {
    "profilePhoto": "https://your-bucket.s3.us-east-1.amazonaws.com/development/profile-photos/profile-1234567890-abc123.jpg"
  }
}
```

### File Validation
- **File types**: JPEG, PNG, GIF, WebP
- **File size**: Maximum 5MB
- **Security**: Files are validated before upload

## Frontend Integration

The frontend code remains unchanged. Profile photos are now served from S3 URLs:

```jsx
// Profile photo URLs are now S3 URLs
<img
  src={`${provider.profilePhoto}`}
  alt="Profile"
/>
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**
   - Check IAM user permissions
   - Verify bucket policy allows public read access
   - Ensure AWS credentials are correct

2. **404 Not Found Error**
   - Verify bucket name in environment variables
   - Check if file was uploaded successfully
   - Confirm region settings

3. **Upload Failures**
   - Check file size (must be ≤ 5MB)
   - Verify file type is supported
   - Check AWS credentials and permissions

### Testing S3 Configuration

Test your S3 setup:

```bash
# In server directory
node -e "
import s3Service from './services/s3Service.js';
console.log('S3 Config:', s3Service.getConfig());
"
```

## Security Best Practices

1. **Separate Buckets**: Use different buckets for development and production
2. **IAM Roles**: In production, consider using IAM roles instead of access keys
3. **CORS Configuration**: Configure CORS if frontend needs direct S3 access
4. **Encryption**: Enable server-side encryption for sensitive data
5. **Monitoring**: Set up CloudWatch monitoring for S3 operations

## Cost Optimization

- **Storage Class**: Use Standard class for frequently accessed images
- **Lifecycle Rules**: Archive old photos to cheaper storage classes
- **CDN**: Consider CloudFront for global distribution
- **Monitoring**: Track usage and costs in AWS Cost Explorer

## Deployment Checklist

- [ ] S3 bucket created and configured
- [ ] IAM user created with proper permissions
- [ ] Environment variables set in production
- [ ] Migration script run (if applicable)
- [ ] File uploads tested
- [ ] Old local files cleaned up
- [ ] Monitoring and alerts configured