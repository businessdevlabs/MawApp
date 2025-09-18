import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const querySubcategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('\n📋 MAIN CATEGORIES:');
    console.log('==================');

    const mainCategories = await ServiceCategory.find({ parentCategory: { $exists: false } })
      .select('_id name description subcategories')
      .sort({ name: 1 });

    for (const category of mainCategories) {
      console.log(`\n🏷️  ${category.name} (${category._id})`);
      console.log(`   📝 ${category.description}`);
      console.log(`   🔗 Subcategory IDs: ${category.subcategories.length} references`);

      if (category.subcategories.length > 0) {
        console.log(`   📄 ID Array: [${category.subcategories.slice(0, 3).join(', ')}...]`);
      }
    }

    console.log('\n\n📋 ALL SUBCATEGORIES:');
    console.log('=====================');

    const subcategories = await ServiceCategory.find({ parentCategory: { $exists: true } })
      .select('_id name parentCategory isActive')
      .populate('parentCategory', 'name')
      .sort({ parentCategory: 1, name: 1 });

    let currentParent = null;
    for (const subcat of subcategories) {
      if (subcat.parentCategory && subcat.parentCategory._id.toString() !== currentParent) {
        currentParent = subcat.parentCategory._id.toString();
        console.log(`\n🏷️  Parent: ${subcat.parentCategory.name} (${subcat.parentCategory._id})`);
      }
      console.log(`   ├── ${subcat.name} (${subcat._id}) - Active: ${subcat.isActive !== false}`);
    }

    console.log('\n\n🏥 HEALTH & WELLNESS DETAILED:');
    console.log('==============================');

    const healthCategory = await ServiceCategory.findById('68a9b3039e01377b5a45e970')
      .populate('subcategories', 'name description icon isActive');

    if (healthCategory) {
      console.log(`📋 Category: ${healthCategory.name} (${healthCategory._id})`);
      console.log(`📝 Description: ${healthCategory.description}`);
      console.log(`🔢 Total subcategories: ${healthCategory.subcategories.length}`);
      console.log(`✅ Is Active: ${healthCategory.isActive}`);

      console.log('\n📄 Subcategories:');
      healthCategory.subcategories.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.name} (${sub._id})`);
        console.log(`      📝 ${sub.description || 'No description'}`);
        console.log(`      ${sub.icon || '📋'} Active: ${sub.isActive !== false}`);
      });
    } else {
      console.log('❌ Health & Wellness category not found');
    }

    console.log('\n\n🔍 DATABASE STATISTICS:');
    console.log('=======================');

    const stats = await ServiceCategory.aggregate([
      {
        $group: {
          _id: { $cond: [{ $exists: ['$parentCategory', true] }, 'subcategory', 'main'] },
          count: { $sum: 1 }
        }
      }
    ]);

    stats.forEach(stat => {
      console.log(`📊 ${stat._id === 'main' ? 'Main Categories' : 'Subcategories'}: ${stat.count}`);
    });

    const totalSubcategories = await ServiceCategory.countDocuments({ parentCategory: { $exists: true } });
    const activeSubcategories = await ServiceCategory.countDocuments({
      parentCategory: { $exists: true },
      $or: [{ isActive: true }, { isActive: { $exists: false } }]
    });

    console.log(`📈 Active Subcategories: ${activeSubcategories}/${totalSubcategories}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 MongoDB disconnected');
  }
};

querySubcategories();