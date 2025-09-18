#!/usr/bin/env node

/**
 * Complete cleanup script to ensure ONLY 4 categories exist
 * This will handle both main categories and any subcategories stored as categories
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';

// Load environment variables
dotenv.config();

const ONLY_THESE_CATEGORIES = [
  {
    _id: "68a9b3039e01377b5a45e970",
    name: "Health & Wellness",
    description: "Medical appointments, therapy sessions, and wellness services",
    icon: "🏥",
    parentCategory: null
  },
  {
    _id: "68a9b3039e01377b5a45e971",
    name: "Beauty & Personal Care",
    description: "Hair salons, nail care, skincare, and beauty treatments",
    icon: "💅",
    parentCategory: null
  },
  {
    _id: "68a9b30f7d1647b29f0b068e",
    name: "Automotive",
    description: "Car maintenance, repairs, and automotive services",
    icon: "🚗",
    parentCategory: null
  },
  {
    _id: "68a9b3039e01377b5a45e972",
    name: "Fitness & Sports",
    description: "Personal training, group classes, and sports activities",
    icon: "💪",
    parentCategory: null
  }
];

async function completeCleanup() {
  try {
    console.log('🚀 Starting COMPLETE category cleanup...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get ALL categories (including subcategories stored as categories)
    const allCategories = await ServiceCategory.find({}).lean();
    console.log(`📊 Total categories found: ${allCategories.length}`);

    // Show what we're about to delete
    console.log('\n🗑️  Categories that will be DELETED:');
    const categoriesToDelete = allCategories.filter(cat =>
      !ONLY_THESE_CATEGORIES.some(desired => desired._id === cat._id.toString())
    );

    categoriesToDelete.forEach(cat => {
      console.log(`   • ${cat._id} - ${cat.name} ${cat.parentCategory ? '(subcategory)' : '(main category)'}`);
    });

    console.log(`\n   Total to delete: ${categoriesToDelete.length}`);

    // Show what we're keeping/adding
    console.log('\n✅ Categories that will be KEPT/ADDED:');
    ONLY_THESE_CATEGORIES.forEach(cat => {
      console.log(`   • ${cat._id} - ${cat.name}`);
    });

    // NUCLEAR OPTION: Delete EVERYTHING
    console.log('\n💥 NUCLEAR CLEANUP: Deleting ALL categories...');
    const deleteResult = await ServiceCategory.deleteMany({});
    console.log(`   💀 Deleted ${deleteResult.deletedCount} categories`);

    // Insert ONLY the 4 desired categories
    console.log('\n📥 Inserting ONLY the 4 desired categories...');
    for (const category of ONLY_THESE_CATEGORIES) {
      try {
        const newCategory = new ServiceCategory({
          _id: new mongoose.Types.ObjectId(category._id),
          name: category.name,
          description: category.description,
          icon: category.icon,
          isActive: true,
          parentCategory: category.parentCategory,
          subcategories: [],
          commonServices: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newCategory.save();
        console.log(`   ✅ Added: ${category.name} (${category._id})`);
      } catch (error) {
        console.error(`   ❌ Failed to add ${category.name}:`, error.message);
      }
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const finalCategories = await ServiceCategory.find({}).lean();
    console.log(`📊 Final count: ${finalCategories.length}`);

    console.log('\n✅ Final categories in database:');
    finalCategories.forEach(cat => {
      console.log(`   • ${cat._id} - ${cat.name} (Active: ${cat.isActive})`);
    });

    // Test the API endpoint
    console.log('\n🧪 Testing API response...');
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      const data = await response.json();
      console.log(`📡 API returns ${data.categories.length} categories`);

      if (data.categories.length === 4) {
        console.log('✅ API is returning exactly 4 categories - SUCCESS!');
      } else {
        console.log('❌ API is still returning wrong number of categories');
        console.log('Categories from API:', data.categories.map(c => `${c._id} - ${c.name}`));
      }
    } catch (apiError) {
      console.log('⚠️  Could not test API (server may not be running)');
    }

    console.log('\n🎉 COMPLETE cleanup finished!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the cleanup
completeCleanup().catch(console.error);