import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const checkCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find all main categories (no parent)
    const mainCategories = await ServiceCategory.find({ parentCategory: { $exists: false } })
      .select('_id name description');

    console.log('\n📋 Main Categories in Database:');
    mainCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id})`);
    });

    // Check specifically for Health & Wellness
    const healthCategories = await ServiceCategory.find({
      name: { $regex: /health/i }
    }).select('_id name parentCategory');

    console.log('\n🏥 Health-related Categories:');
    healthCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id}) Parent: ${cat.parentCategory || 'None'}`);
    });

    // Check the specific ID the frontend is looking for
    const frontendId = '68a9b3039e01377b5a45e970';
    const frontendCategory = await ServiceCategory.findById(frontendId);

    console.log(`\n🔍 Frontend Expected ID (${frontendId}):`);
    if (frontendCategory) {
      console.log(`✅ Found: ${frontendCategory.name}`);
    } else {
      console.log('❌ Not found');
    }

    // Check the ID we found in database before
    const databaseId = '688fd2fb286ae2df9e5a3ad8';
    const databaseCategory = await ServiceCategory.findById(databaseId);

    console.log(`\n🗄️ Database ID (${databaseId}):`);
    if (databaseCategory) {
      console.log(`✅ Found: ${databaseCategory.name}`);
      console.log(`Subcategories count: ${databaseCategory.subcategories.length}`);
    } else {
      console.log('❌ Not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

checkCategories();