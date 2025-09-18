import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const seedCorrectCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Only the 4 categories as requested
    const categoriesData = [
      {
        "_id": "68a9b3039e01377b5a45e970",
        "name": "Health & Wellness",
        "description": "Medical appointments, therapy sessions, and wellness services",
        "icon": "🏥",
        "isActive": true,
        "parentCategory": null,
        "subcategories": [],
        "commonServices": []
      },
      {
        "_id": "68a9b3039e01377b5a45e971",
        "name": "Beauty & Personal Care",
        "description": "Hair salons, nail care, skincare, and beauty treatments",
        "icon": "💅",
        "isActive": true,
        "parentCategory": null,
        "subcategories": [],
        "commonServices": []
      },
      {
        "_id": "68a9b30f7d1647b29f0b068e",
        "name": "Automotive",
        "description": "Car maintenance, repairs, and automotive services",
        "icon": "🚗",
        "isActive": true,
        "parentCategory": null,
        "subcategories": [],
        "commonServices": []
      },
      {
        "_id": "68a9b3039e01377b5a45e972",
        "name": "Fitness & Sports",
        "description": "Personal training, group classes, and sports activities",
        "icon": "💪",
        "isActive": true,
        "parentCategory": null,
        "subcategories": [],
        "commonServices": []
      }
    ];

    console.log('🗑️  Clearing existing categories...');
    await ServiceCategory.deleteMany({});

    console.log('📦 Creating new categories...');
    for (const categoryData of categoriesData) {
      const newCategory = new ServiceCategory({
        _id: new mongoose.Types.ObjectId(categoryData._id),
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        isActive: categoryData.isActive,
        parentCategory: categoryData.parentCategory,
        subcategories: [],
        commonServices: categoryData.commonServices,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newCategory.save();
      console.log(`✅ Created: ${categoryData.name} (${categoryData._id})`);
    }

    console.log('\n🎉 All categories have been seeded successfully!');

    // Verify the Health & Wellness category exists with correct ID
    const healthCategory = await ServiceCategory.findById('68a9b3039e01377b5a45e970');
    if (healthCategory) {
      console.log(`✅ Health & Wellness verified: ${healthCategory.name} (${healthCategory._id})`);
    } else {
      console.log('❌ Health & Wellness not found after seeding');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

seedCorrectCategories();