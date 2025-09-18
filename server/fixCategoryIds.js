import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';

const MONGODB_URI = 'mongodb://localhost:27017/appoint-zenith';

const fixCategoryIds = async () => {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // The frontend expects this ID for Health & Wellness
    const frontendHealthId = '68a9b3039e01377b5a45e970';
    // But the database has this ID
    const databaseHealthId = '688fd2fb286ae2df9e5a3ad8';

    // Check if frontend ID exists
    const frontendCategory = await ServiceCategory.findById(frontendHealthId);
    console.log('Frontend category exists:', !!frontendCategory);

    // Check database category
    const databaseCategory = await ServiceCategory.findById(databaseHealthId);
    console.log('Database category exists:', !!databaseCategory);

    if (databaseCategory) {
      console.log('Database category subcategories count:', databaseCategory.subcategories.length);
    }

    if (!frontendCategory && databaseCategory) {
      console.log('📋 Creating the missing frontend category...');

      // Create a new category with the frontend ID and copy all data
      const newHealthCategory = new ServiceCategory({
        _id: new mongoose.Types.ObjectId(frontendHealthId),
        name: databaseCategory.name,
        description: databaseCategory.description,
        icon: databaseCategory.icon,
        isActive: databaseCategory.isActive,
        parentCategory: databaseCategory.parentCategory,
        subcategories: [], // Will be populated after creating subcategories
        commonServices: databaseCategory.commonServices
      });

      await newHealthCategory.save();
      console.log('✅ Created Health & Wellness with frontend ID');

      // Now update all existing subcategories to point to the new parent
      const subcategories = await ServiceCategory.find({ parentCategory: databaseHealthId });
      console.log(`📋 Found ${subcategories.length} subcategories to update`);

      const newSubcategoryIds = [];

      for (const subcat of subcategories) {
        // Create new subcategory with updated parent
        const newSubcat = new ServiceCategory({
          name: subcat.name,
          description: subcat.description,
          icon: subcat.icon,
          isActive: subcat.isActive,
          parentCategory: frontendHealthId,
          subcategories: []
        });

        await newSubcat.save();
        newSubcategoryIds.push(newSubcat._id);
        console.log(`✅ Created subcategory: ${subcat.name}`);
      }

      // Update the new health category with subcategory references
      newHealthCategory.subcategories = newSubcategoryIds;
      await newHealthCategory.save();

      console.log(`✅ Updated Health & Wellness with ${newSubcategoryIds.length} subcategories`);

      // Optionally remove the old category and subcategories
      console.log('🧹 Cleaning up old categories...');
      await ServiceCategory.deleteMany({ parentCategory: databaseHealthId });
      await ServiceCategory.findByIdAndDelete(databaseHealthId);
      console.log('✅ Removed old categories');

      // Test the result
      const finalCategory = await ServiceCategory.findById(frontendHealthId)
        .populate('subcategories', 'name');

      console.log('\n🎉 SUCCESS! Final verification:');
      console.log('Health & Wellness ID:', finalCategory._id);
      console.log('Subcategories count:', finalCategory.subcategories.length);
      console.log('Subcategories:', finalCategory.subcategories.map(s => s.name));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

fixCategoryIds();