import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';

const MONGODB_URI = 'mongodb://localhost:27017/appoint-zenith';

const updateCategoryId = async () => {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    const oldHealthId = '688fd2fb286ae2df9e5a3ad8';
    const newHealthId = '68a9b3039e01377b5a45e970';

    // Get the existing Health & Wellness category
    const existingCategory = await ServiceCategory.findById(oldHealthId);

    if (!existingCategory) {
      console.log('❌ Existing Health & Wellness category not found');
      return;
    }

    console.log('📋 Found existing Health & Wellness category');
    console.log('Current subcategories:', existingCategory.subcategories.length);

    // Update the category ID using MongoDB's direct update operation
    // First, copy all data to a new document with the desired ID
    const categoryData = existingCategory.toObject();
    delete categoryData._id; // Remove the old ID
    categoryData._id = new mongoose.Types.ObjectId(newHealthId);

    // Create new category with the frontend ID
    const newCategory = new ServiceCategory(categoryData);
    await newCategory.save();
    console.log('✅ Created new Health & Wellness with frontend ID');

    // Update all subcategories to point to the new parent ID
    const updateResult = await ServiceCategory.updateMany(
      { parentCategory: oldHealthId },
      { parentCategory: newHealthId }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} subcategories to new parent ID`);

    // Delete the old category
    await ServiceCategory.findByIdAndDelete(oldHealthId);
    console.log('✅ Removed old category');

    // Verify the result
    const verifyCategory = await ServiceCategory.findById(newHealthId)
      .populate('subcategories', 'name');

    console.log('\n🎉 SUCCESS! Verification:');
    console.log('New Health & Wellness ID:', verifyCategory._id);
    console.log('Subcategories count:', verifyCategory.subcategories.length);
    if (verifyCategory.subcategories.length > 0) {
      console.log('Sample subcategories:', verifyCategory.subcategories.slice(0, 5).map(s => s.name));
    }

    console.log('\n📋 Now testing API endpoint...');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

updateCategoryId();