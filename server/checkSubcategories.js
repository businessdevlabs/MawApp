import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const checkSubcategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find all categories and subcategories
    const allCategories = await ServiceCategory.find();
    console.log('All categories:');
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat._id}) - Parent: ${cat.parentCategory || 'None'} - Subcategories: ${cat.subcategories.length}`);
    });

    // Find the Health & Wellness category specifically
    const healthCategory = await ServiceCategory.findOne({ name: 'Health & Wellness' })
      .populate('subcategories', 'name');

    console.log('\nHealth & Wellness category:');
    console.log('ID:', healthCategory?._id);
    console.log('Subcategories length:', healthCategory?.subcategories?.length || 0);
    console.log('Subcategories:', healthCategory?.subcategories?.map(sub => sub.name) || []);

    // Find subcategories where parentCategory is Health & Wellness
    const subcategoriesWithParent = await ServiceCategory.find({
      parentCategory: healthCategory?._id
    });

    console.log('\nSubcategories with Health & Wellness as parent:');
    subcategoriesWithParent.forEach(subcat => {
      console.log(`- ${subcat.name} (${subcat._id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

checkSubcategories();