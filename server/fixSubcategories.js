import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const fixSubcategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find the frontend's Health & Wellness category (the one being used)
    const frontendHealthCategory = await ServiceCategory.findById('68a9b3039e01377b5a45e970');
    console.log('Frontend Health & Wellness category:', frontendHealthCategory?.name);

    // Find the backend's Health & Wellness category (the one with subcategories)
    const backendHealthCategory = await ServiceCategory.findById('688fd2fb286ae2df9e5a3ad8');
    console.log('Backend Health & Wellness category:', backendHealthCategory?.name);

    if (!frontendHealthCategory) {
      console.log('❌ Frontend Health & Wellness category not found');
      return;
    }

    if (!backendHealthCategory) {
      console.log('❌ Backend Health & Wellness category not found');
      return;
    }

    // Find all subcategories that have the backend category as parent
    const subcategories = await ServiceCategory.find({
      parentCategory: backendHealthCategory._id
    });

    console.log(`📋 Found ${subcategories.length} subcategories to move`);

    // Update all subcategories to point to the frontend category
    for (const subcat of subcategories) {
      subcat.parentCategory = frontendHealthCategory._id;
      await subcat.save();
      console.log(`✅ Updated ${subcat.name} parent category`);
    }

    // Update the frontend category to include these subcategories
    frontendHealthCategory.subcategories = subcategories.map(sub => sub._id);
    await frontendHealthCategory.save();
    console.log(`✅ Updated frontend category with ${subcategories.length} subcategories`);

    // Clear the backend category's subcategories
    backendHealthCategory.subcategories = [];
    await backendHealthCategory.save();
    console.log('✅ Cleared backend category subcategories');

    // Optionally delete the duplicate backend category
    await ServiceCategory.findByIdAndDelete(backendHealthCategory._id);
    console.log('✅ Deleted duplicate backend category');

    console.log('🎉 Successfully moved subcategories to frontend category');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

fixSubcategories();