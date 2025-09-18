#!/usr/bin/env node

/**
 * Migration script to move existing local profile photos to S3
 * This script should be run after setting up S3 configuration
 *
 * Usage:
 * node scripts/migratePhotosToS3.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import s3Service from '../services/s3Service.js';
import ServiceProvider from '../models/ServiceProvider.js';

// Load environment variables
dotenv.config();

const UPLOADS_DIR = './uploads/profile-photos';

class PhotoMigration {
  constructor() {
    this.migratedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;
    this.errors = [];
  }

  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async validateS3Configuration() {
    try {
      const config = s3Service.getConfig();
      console.log('S3 Configuration:', config);

      if (!config.hasCredentials) {
        throw new Error('AWS credentials not configured. Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
      }

      if (!config.bucketName) {
        throw new Error('AWS S3 bucket name not configured. Please check AWS_S3_BUCKET_NAME environment variable.');
      }

      console.log('✅ S3 configuration validated');
      return true;
    } catch (error) {
      console.error('❌ S3 configuration error:', error.message);
      return false;
    }
  }

  async findProvidersWithLocalPhotos() {
    try {
      // Find providers with local photo paths (not S3 URLs)
      const providers = await ServiceProvider.find({
        profilePhoto: {
          $exists: true,
          $ne: null,
          $not: /amazonaws\.com/ // Exclude existing S3 URLs
        }
      });

      console.log(`Found ${providers.length} providers with local photos to migrate`);
      return providers;
    } catch (error) {
      console.error('Error finding providers:', error);
      return [];
    }
  }

  async migratePhotoToS3(provider) {
    try {
      const localPhotoPath = provider.profilePhoto;

      // Handle both absolute and relative paths
      const fullPath = localPhotoPath.startsWith('./uploads/')
        ? localPhotoPath
        : path.join(UPLOADS_DIR, path.basename(localPhotoPath));

      console.log(`\n📸 Migrating photo for provider ${provider.businessName}`);
      console.log(`   Local path: ${localPhotoPath}`);
      console.log(`   Full path: ${fullPath}`);

      // Check if local file exists
      if (!fs.existsSync(fullPath)) {
        console.log(`   ⚠️  Local file not found, skipping`);
        this.skippedCount++;
        return false;
      }

      // Read file data
      const fileBuffer = fs.readFileSync(fullPath);
      const originalName = path.basename(localPhotoPath);

      // Determine MIME type from file extension
      const ext = path.extname(originalName).toLowerCase();
      const mimeTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      const mimeType = mimeTypeMap[ext] || 'image/jpeg';

      console.log(`   📤 Uploading to S3...`);

      // Upload to S3
      const uploadResult = await s3Service.uploadFile(fileBuffer, originalName, mimeType);

      // Update provider record
      await ServiceProvider.findByIdAndUpdate(provider._id, {
        profilePhoto: uploadResult.url
      });

      console.log(`   ✅ Successfully migrated to: ${uploadResult.url}`);

      // Optionally delete local file after successful migration
      // Uncomment the next line if you want to remove local files after migration
      // fs.unlinkSync(fullPath);

      this.migratedCount++;
      return true;

    } catch (error) {
      console.error(`   ❌ Failed to migrate photo for ${provider.businessName}:`, error.message);
      this.errors.push({
        providerId: provider._id,
        businessName: provider.businessName,
        error: error.message
      });
      this.failedCount++;
      return false;
    }
  }

  async runMigration() {
    console.log('🚀 Starting photo migration to S3...\n');

    // Validate S3 configuration
    const s3Valid = await this.validateS3Configuration();
    if (!s3Valid) {
      console.log('❌ Migration aborted due to S3 configuration issues');
      return;
    }

    // Find providers with local photos
    const providers = await this.findProvidersWithLocalPhotos();

    if (providers.length === 0) {
      console.log('✅ No local photos found to migrate');
      return;
    }

    // Migrate each provider's photo
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      console.log(`\n[${i + 1}/${providers.length}] Processing ${provider.businessName}...`);
      await this.migratePhotoToS3(provider);

      // Add a small delay to avoid overwhelming S3
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${this.migratedCount}`);
    console.log(`❌ Failed migrations: ${this.failedCount}`);
    console.log(`⏭️  Skipped (file not found): ${this.skippedCount}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => {
        console.log(`   • ${error.businessName}: ${error.error}`);
      });
    }

    console.log('\n🎉 Migration completed!');

    if (this.migratedCount > 0) {
      console.log('\n📝 Next steps:');
      console.log('1. Verify photos are accessible via S3 URLs in the application');
      console.log('2. Once confirmed, you can remove local photo files from ./uploads/profile-photos/');
      console.log('3. Update your deployment process to use S3 for new uploads');
    }
  }

  async cleanup() {
    try {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
}

// Run migration
async function main() {
  const migration = new PhotoMigration();

  try {
    await migration.connectToDatabase();
    await migration.runMigration();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migration.cleanup();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Migration interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Migration terminated');
  process.exit(0);
});

// Run the migration
main().catch(console.error);