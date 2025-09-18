#!/usr/bin/env node

/**
 * Script to update categories to only have 4 specific categories
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';

// Load environment variables
dotenv.config();

const DESIRED_CATEGORIES = [
  {
    _id: "68a9b3039e01377b5a45e970",
    name: "Health & Wellness"
  },
  {
    _id: "68a9b3039e01377b5a45e971",
    name: "Beauty & Personal Care"
  },
  {
    _id: "68a9b30f7d1647b29f0b068e",
    name: "Automotive"
  },
  {
    _id: "68a9b3039e01377b5a45e972",
    name: "Fitness & Sports"
  }
];

async function updateCategories() {
  try {
    console.log('🚀 Starting category update...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get current categories count
    const currentCount = await ServiceCategory.countDocuments();
    console.log(`📊 Current categories count: ${currentCount}`);

    // Get current categories
    const currentCategories = await ServiceCategory.find({}, '_id name').lean();
    console.log('\n📋 Current categories:');
    currentCategories.forEach(cat => {
      console.log(`  • ${cat._id} - ${cat.name}`);
    });

    // Delete all existing categories
    console.log('\n🗑️  Removing all existing categories...');
    const deleteResult = await ServiceCategory.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} categories`);

    // Insert the 4 desired categories
    console.log('\n📥 Inserting desired categories...');
    for (const category of DESIRED_CATEGORIES) {
      try {
        const newCategory = new ServiceCategory({
          _id: new mongoose.Types.ObjectId(category._id),
          name: category.name,
          description: `${category.name} services and providers`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newCategory.save();
        console.log(`   ✅ Added: ${category.name} (${category._id})`);
      } catch (error) {
        console.error(`   ❌ Failed to add ${category.name}:`, error.message);
      }
    }

    // Verify final count
    const finalCount = await ServiceCategory.countDocuments();
    console.log(`\n📊 Final categories count: ${finalCount}`);

    // Display final categories
    const finalCategories = await ServiceCategory.find({}, '_id name isActive').lean();
    console.log('\n✅ Final categories:');
    finalCategories.forEach(cat => {
      console.log(`  • ${cat._id} - ${cat.name} (Active: ${cat.isActive})`);
    });

    console.log('\n🎉 Category update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating categories:', error);
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

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the update
updateCategories().catch(console.error);