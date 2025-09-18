import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const addSubcategoriesToCorrectCategory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // The API is serving Health & Wellness with ID: 68a9b3039e01377b5a45e970
    // But we need to create this category and add subcategories to it

    // First, check if this category exists
    let targetCategory = await ServiceCategory.findById('68a9b3039e01377b5a45e970');

    if (!targetCategory) {
      console.log('❌ Target category not found in database');
      console.log('This suggests the API might be connecting to a different database or data source');

      // Let's find the actual Health & Wellness category and update its ID
      const existingHealthCategory = await ServiceCategory.findOne({ name: 'Health & Wellness' });

      if (existingHealthCategory) {
        console.log('📋 Found existing Health & Wellness category:', existingHealthCategory._id);
        console.log('Subcategories count:', existingHealthCategory.subcategories.length);

        // Check if it already has subcategories
        if (existingHealthCategory.subcategories.length > 0) {
          console.log('✅ Category already has subcategories');
          const subcategories = await ServiceCategory.find({
            parentCategory: existingHealthCategory._id
          });
          console.log('Subcategory names:');
          subcategories.forEach(sub => console.log(`- ${sub.name}`));
        } else {
          console.log('⚠️ Category exists but has no subcategories');
        }
      }
      return;
    }

    console.log('✅ Found target category');

    // Define medical specializations
    const medicalSpecializations = [
      'General Medicine',
      'Cardiology',
      'Dermatology',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Ophthalmology',
      'Dentistry',
      'Physical Therapy',
      'Psychology',
      'Nutrition'
    ];

    // Create subcategories for this specific category
    const createdSubcategories = [];

    for (const specName of medicalSpecializations) {
      // Check if subcategory already exists
      const existingSubcategory = await ServiceCategory.findOne({
        name: specName,
        parentCategory: targetCategory._id
      });

      if (!existingSubcategory) {
        const subcategory = new ServiceCategory({
          name: specName,
          description: `${specName} specialist`,
          icon: '🩺',
          parentCategory: targetCategory._id,
          subcategories: []
        });

        await subcategory.save();
        createdSubcategories.push(subcategory);
        console.log(`✅ Created subcategory: ${specName}`);
      } else {
        createdSubcategories.push(existingSubcategory);
        console.log(`⚡ Subcategory already exists: ${specName}`);
      }
    }

    // Update the target category to include these subcategories
    targetCategory.subcategories = createdSubcategories.map(sub => sub._id);
    await targetCategory.save();

    console.log(`🎉 Successfully added ${createdSubcategories.length} subcategories to target category`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

addSubcategoriesToCorrectCategory();