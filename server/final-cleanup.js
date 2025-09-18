#!/usr/bin/env node

import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

async function finalCompleteCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all categories
    const allCategories = await ServiceCategory.find({});
    console.log(`📊 Total categories found: ${allCategories.length}`);

    // List all categories
    allCategories.forEach(cat => {
      console.log(`   • ${cat._id} - ${cat.name} ${cat.parentCategory ? '(subcategory of ' + cat.parentCategory + ')' : '(main category)'}`);
    });

    // Delete ALL categories (including subcategories)
    console.log('\n💥 Deleting ALL categories...');
    const deleteResult = await ServiceCategory.deleteMany({});
    console.log(`   💀 Deleted ${deleteResult.deletedCount} categories`);

    // Insert ONLY the 4 desired categories
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

    console.log('\n📥 Inserting ONLY the 4 desired categories...');
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
      console.log(`   ✅ Added: ${category.name} (${category._id})`);
    }

    // Final verification
    const finalCategories = await ServiceCategory.find({}).lean();
    console.log(`\n📊 Final count: ${finalCategories.length}`);

    console.log('\n✅ Final categories in database:');
    finalCategories.forEach(cat => {
      console.log(`   • ${cat._id} - ${cat.name} (Active: ${cat.isActive}, Parent: ${cat.parentCategory || 'none'})`);
    });

    console.log('\n🎉 Complete cleanup finished!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

finalCompleteCleanup();