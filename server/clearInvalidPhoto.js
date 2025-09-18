import mongoose from 'mongoose';
import ServiceProvider from './models/ServiceProvider.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const clearInvalidPhotos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find providers with profilePhoto that don't exist on filesystem
    const providers = await ServiceProvider.find({ profilePhoto: { $exists: true, $ne: null } });

    console.log(`Found ${providers.length} providers with profilePhoto`);

    for (const provider of providers) {
      if (provider.profilePhoto) {
        const filename = path.basename(provider.profilePhoto);
        const filePath = path.join('./uploads/profile-photos', filename);

        if (!fs.existsSync(filePath)) {
          console.log(`❌ File not found for provider ${provider._id}: ${provider.profilePhoto}`);
          console.log(`Clearing invalid profilePhoto for provider ${provider.businessName}`);

          await ServiceProvider.findByIdAndUpdate(provider._id, { $unset: { profilePhoto: 1 } });
          console.log(`✅ Cleared profilePhoto for ${provider.businessName}`);
        } else {
          console.log(`✅ File exists for ${provider.businessName}: ${provider.profilePhoto}`);
        }
      }
    }

    console.log('🎉 Finished checking provider photos');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

clearInvalidPhotos();