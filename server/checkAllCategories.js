import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAllCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find all Health & Wellness categories
    const healthCategories = await ServiceCategory.find({ name: 'Health & Wellness' })
      .populate('subcategories', 'name');

    console.log(`Found ${healthCategories.length} Health & Wellness categories:`);

    healthCategories.forEach((cat, index) => {
      console.log(`\n${index + 1}. Health & Wellness Category:`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   Created: ${cat.createdAt}`);
      console.log(`   Subcategories: ${cat.subcategories.length}`);
      if (cat.subcategories.length > 0) {
        console.log(`   Subcategory names:`, cat.subcategories.map(sub => sub.name));
      }
    });

    // Check if the frontend ID exists at all
    const frontendCategory = await ServiceCategory.findById('68a9b3039e01377b5a45e970');
    console.log('\nFrontend category (68a9b3039e01377b5a45e970):', frontendCategory ? 'EXISTS' : 'NOT FOUND');

    // Find all categories to see the current state
    const allCategories = await ServiceCategory.find({ parentCategory: null });
    console.log('\nAll main categories:');
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat._id}) - Subcategories: ${cat.subcategories.length}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 MongoDB disconnected');
  }
};

checkAllCategories();