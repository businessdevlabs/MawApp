import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const seedSubcategoriesToFrontendCategory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Use the exact Health & Wellness category ID that the frontend is using
    const frontendHealthCategoryId = '68a9b3039e01377b5a45e970';

    const healthCategory = await ServiceCategory.findById(frontendHealthCategoryId);

    if (!healthCategory) {
      console.log('❌ Frontend Health & Wellness category not found:', frontendHealthCategoryId);
      return;
    }

    console.log('📋 Found Health & Wellness category:', healthCategory.name);
    console.log('Current subcategories count:', healthCategory.subcategories.length);

    // Define medical specializations
    const medicalSpecializations = [
      {
        name: 'General Medicine',
        description: 'General practitioners and family medicine doctors',
        icon: '🩺'
      },
      {
        name: 'Cardiology',
        description: 'Heart and cardiovascular system specialists',
        icon: '❤️'
      },
      {
        name: 'Dermatology',
        description: 'Skin, hair, and nail specialists',
        icon: '🧴'
      },
      {
        name: 'Neurology',
        description: 'Brain and nervous system specialists',
        icon: '🧠'
      },
      {
        name: 'Orthopedics',
        description: 'Bone, joint, and muscle specialists',
        icon: '🦴'
      },
      {
        name: 'Pediatrics',
        description: 'Children\'s health specialists',
        icon: '👶'
      },
      {
        name: 'Psychiatry',
        description: 'Mental health specialists',
        icon: '🧘'
      },
      {
        name: 'Ophthalmology',
        description: 'Eye and vision specialists',
        icon: '👁️'
      },
      {
        name: 'Dentistry',
        description: 'Dental and oral health specialists',
        icon: '🦷'
      },
      {
        name: 'Physical Therapy',
        description: 'Rehabilitation and movement specialists',
        icon: '🏃'
      },
      {
        name: 'Psychology',
        description: 'Mental health counselors and therapists',
        icon: '💭'
      },
      {
        name: 'Nutrition',
        description: 'Dietary and nutritional health specialists',
        icon: '🥗'
      }
    ];

    // Create subcategories
    const createdSubcategories = [];

    for (const spec of medicalSpecializations) {
      // Check if subcategory already exists for this parent category
      const existingSubcategory = await ServiceCategory.findOne({
        name: spec.name,
        parentCategory: healthCategory._id
      });

      if (!existingSubcategory) {
        const subcategory = new ServiceCategory({
          name: spec.name,
          description: spec.description,
          icon: spec.icon,
          parentCategory: healthCategory._id,
          subcategories: [], // Subcategories don't have their own subcategories
          isActive: true
        });

        await subcategory.save();
        createdSubcategories.push(subcategory);
        console.log(`✅ Created subcategory: ${spec.name}`);
      } else {
        createdSubcategories.push(existingSubcategory);
        console.log(`⚡ Subcategory already exists: ${spec.name}`);
      }
    }

    // Update the Health & Wellness category to include these subcategories
    healthCategory.subcategories = createdSubcategories.map(sub => sub._id);
    await healthCategory.save();

    console.log(`🎉 Successfully seeded ${createdSubcategories.length} subcategories for Health & Wellness`);
    console.log('📋 Health & Wellness now has subcategories:', createdSubcategories.map(sub => sub.name));

    // Verify by checking the API endpoint
    console.log('\n🔍 Verification - Checking subcategories:');
    const updatedCategory = await ServiceCategory.findById(frontendHealthCategoryId)
      .populate('subcategories', 'name');

    console.log('Populated subcategories:');
    updatedCategory.subcategories.forEach(sub => {
      console.log(`- ${sub.name}`);
    });

  } catch (error) {
    console.error('❌ Error seeding subcategories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

seedSubcategoriesToFrontendCategory();