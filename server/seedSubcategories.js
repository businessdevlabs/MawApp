import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const seedSubcategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for seeding');

    // Find the Health & Wellness category
    const healthCategory = await ServiceCategory.findOne({ name: 'Health & Wellness' });

    if (!healthCategory) {
      console.log('❌ Health & Wellness category not found');
      return;
    }

    console.log('📋 Found Health & Wellness category:', healthCategory.name);

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
      // Check if subcategory already exists
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
          subcategories: [] // Subcategories don't have their own subcategories
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
    console.log('📋 Subcategories:', createdSubcategories.map(sub => sub.name));

  } catch (error) {
    console.error('❌ Error seeding subcategories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

seedSubcategories();