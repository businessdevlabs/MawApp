import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';

const MONGODB_URI = 'mongodb://localhost:27017/appoint-zenith';

const directSubcategoryUpdate = async () => {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    const healthCategoryId = '68a9b3039e01377b5a45e970';

    // First, let's check if this category exists in this database
    console.log('Looking for category:', healthCategoryId);
    const healthCategory = await ServiceCategory.findById(healthCategoryId);

    if (!healthCategory) {
      console.log('❌ Category not found. Let\'s check what categories exist:');
      const allCategories = await ServiceCategory.find({}, '_id name');
      console.log('Available categories:');
      allCategories.forEach(cat => {
        console.log(`- ${cat.name} (${cat._id})`);
      });
      return;
    }

    console.log('✅ Found category:', healthCategory.name);

    // Medical specializations to add
    const specializations = [
      'General Medicine', 'Cardiology', 'Dermatology', 'Neurology',
      'Orthopedics', 'Pediatrics', 'Psychiatry', 'Ophthalmology',
      'Dentistry', 'Physical Therapy', 'Psychology', 'Nutrition'
    ];

    const subcategoryIds = [];

    for (const specName of specializations) {
      // Check if subcategory exists
      let subcategory = await ServiceCategory.findOne({
        name: specName,
        parentCategory: healthCategoryId
      });

      if (!subcategory) {
        // Create new subcategory
        subcategory = new ServiceCategory({
          name: specName,
          description: `${specName} specialist`,
          icon: '🩺',
          parentCategory: healthCategoryId,
          isActive: true,
          subcategories: []
        });

        await subcategory.save();
        console.log(`✅ Created: ${specName} (${subcategory._id})`);
      } else {
        console.log(`⚡ Exists: ${specName} (${subcategory._id})`);
      }

      subcategoryIds.push(subcategory._id);
    }

    // Update the parent category with subcategory references
    healthCategory.subcategories = subcategoryIds;
    await healthCategory.save();

    console.log(`🎉 Updated Health & Wellness with ${subcategoryIds.length} subcategories`);

    // Test the API endpoint functionality by simulating the query
    const testCategory = await ServiceCategory.findById(healthCategoryId)
      .populate('subcategories', 'name isActive');

    console.log('\n🔍 API Test - Subcategories that would be returned:');
    if (testCategory && testCategory.subcategories) {
      const activeSubcategories = testCategory.subcategories
        .filter(subcat => subcat.isActive !== false)
        .map(subcat => subcat.name);

      console.log('Active subcategories:', activeSubcategories);
      console.log('Count:', activeSubcategories.length);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

directSubcategoryUpdate();