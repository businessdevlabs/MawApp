#!/usr/bin/env node

/**
 * Final cleanup script with specific database URI
 */

import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';

const MONGODB_URI = 'mongodb://localhost:27017/appoint-zenith';

const ONLY_THESE_CATEGORIES = [
  {
    _id: "68a9b3039e01377b5a45e970",
    name: "Health & Wellness",
    description: "Medical appointments, therapy sessions, and wellness services",
    icon: "🏥"
  },
  {
    _id: "68a9b3039e01377b5a45e971",
    name: "Beauty & Personal Care",
    description: "Hair salons, nail care, skincare, and beauty treatments",
    icon: "💅"
  },
  {
    _id: "68a9b30f7d1647b29f0b068e",
    name: "Automotive",
    description: "Car maintenance, repairs, and automotive services",
    icon: "🚗"
  },
  {
    _id: "68a9b3039e01377b5a45e972",
    name: "Fitness & Sports",
    description: "Personal training, group classes, and sports activities",
    icon: "💪"
  }
];

async function finalCleanup() {
  try {
    console.log('🚀 Final category cleanup with specific database...');
    console.log('Database:', MONGODB_URI);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete ALL categories
    console.log('\n💥 Deleting ALL categories...');
    const deleteResult = await ServiceCategory.deleteMany({});
    console.log(`   💀 Deleted ${deleteResult.deletedCount} categories`);

    // Insert only the 4 categories
    console.log('\n📥 Inserting ONLY the 4 categories...');
    for (const category of ONLY_THESE_CATEGORIES) {
      const newCategory = new ServiceCategory({
        _id: new mongoose.Types.ObjectId(category._id),
        name: category.name,
        description: category.description,
        icon: category.icon,
        isActive: true,
        parentCategory: null,
        subcategories: [],
        commonServices: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newCategory.save();
      console.log(`   ✅ Added: ${category.name}`);
    }

    // Final verification
    const finalCategories = await ServiceCategory.find({}).lean();
    console.log(`\n📊 Final count: ${finalCategories.length}`);

    console.log('✅ Final categories:');
    finalCategories.forEach(cat => {
      console.log(`   • ${cat._id} - ${cat.name}`);
    });

    console.log('\n🎉 Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  }
}

finalCleanup();