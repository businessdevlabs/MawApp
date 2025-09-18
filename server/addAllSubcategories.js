import mongoose from 'mongoose';
import ServiceCategory from './models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const addAllSubcategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Define subcategories for each main category
    const categorySubcategories = {
      // Health & Wellness subcategories
      '68a9b3039e01377b5a45e970': [
        { name: 'General Medicine', description: 'General practitioners and family medicine doctors', icon: '🩺' },
        { name: 'Cardiology', description: 'Heart and cardiovascular system specialists', icon: '❤️' },
        { name: 'Dermatology', description: 'Skin, hair, and nail specialists', icon: '🧴' },
        { name: 'Neurology', description: 'Brain and nervous system specialists', icon: '🧠' },
        { name: 'Orthopedics', description: 'Bone, joint, and muscle specialists', icon: '🦴' },
        { name: 'Pediatrics', description: 'Children\'s health specialists', icon: '👶' },
        { name: 'Psychiatry', description: 'Mental health specialists', icon: '🧘' },
        { name: 'Ophthalmology', description: 'Eye and vision specialists', icon: '👁️' },
        { name: 'Dentistry', description: 'Dental and oral health specialists', icon: '🦷' },
        { name: 'Physical Therapy', description: 'Rehabilitation and movement specialists', icon: '🏃' },
        { name: 'Psychology', description: 'Mental health counselors and therapists', icon: '💭' },
        { name: 'Nutrition', description: 'Dietary and nutritional health specialists', icon: '🥗' }
      ],

      // Beauty & Personal Care subcategories
      '68a9b3039e01377b5a45e971': [
        { name: 'Hair Styling', description: 'Hair cutting, coloring, and styling services', icon: '💇' },
        { name: 'Nail Care', description: 'Manicure, pedicure, and nail art services', icon: '💅' },
        { name: 'Skincare', description: 'Facial treatments and skincare services', icon: '✨' },
        { name: 'Makeup Services', description: 'Professional makeup application', icon: '💄' },
        { name: 'Massage Therapy', description: 'Relaxation and therapeutic massage', icon: '💆' },
        { name: 'Eyebrow & Lash', description: 'Eyebrow shaping and eyelash services', icon: '👁️' }
      ],

      // Fitness & Sports subcategories
      '68a9b3039e01377b5a45e972': [
        { name: 'Personal Training', description: 'One-on-one fitness coaching', icon: '💪' },
        { name: 'Yoga', description: 'Yoga classes and instruction', icon: '🧘' },
        { name: 'Pilates', description: 'Pilates classes and training', icon: '🤸' },
        { name: 'CrossFit', description: 'High-intensity functional fitness', icon: '🏋️' },
        { name: 'Martial Arts', description: 'Various martial arts training', icon: '🥋' },
        { name: 'Swimming', description: 'Swimming lessons and coaching', icon: '🏊' },
        { name: 'Running', description: 'Running coaching and training', icon: '🏃' },
        { name: 'Team Sports', description: 'Basketball, soccer, tennis coaching', icon: '⚽' }
      ],

      // Professional Services subcategories
      '68a9b3039e01377b5a45e973': [
        { name: 'Legal Services', description: 'Lawyers and legal consultants', icon: '⚖️' },
        { name: 'Accounting', description: 'Bookkeeping and tax services', icon: '📊' },
        { name: 'Real Estate', description: 'Property buying, selling, and management', icon: '🏡' },
        { name: 'Financial Planning', description: 'Investment and financial advisory', icon: '💰' },
        { name: 'Business Consulting', description: 'Strategy and management consulting', icon: '📈' },
        { name: 'Insurance', description: 'Insurance agents and brokers', icon: '🛡️' },
        { name: 'Marketing', description: 'Digital marketing and advertising', icon: '📢' },
        { name: 'Translation', description: 'Language translation services', icon: '🌐' }
      ],

      // Home & Maintenance subcategories
      '68a9b30f7d1647b29f0b068c': [
        { name: 'Cleaning Services', description: 'House and office cleaning', icon: '🧹' },
        { name: 'Plumbing', description: 'Plumbing repairs and installation', icon: '🔧' },
        { name: 'Electrical', description: 'Electrical work and repairs', icon: '⚡' },
        { name: 'HVAC', description: 'Heating, ventilation, and air conditioning', icon: '❄️' },
        { name: 'Landscaping', description: 'Garden and lawn maintenance', icon: '🌱' },
        { name: 'Painting', description: 'Interior and exterior painting', icon: '🎨' },
        { name: 'Handyman', description: 'General home repairs and maintenance', icon: '🔨' },
        { name: 'Pest Control', description: 'Pest and rodent control services', icon: '🐛' }
      ],

      // Education & Tutoring subcategories
      '68a9b30f7d1647b29f0b068d': [
        { name: 'Math Tutoring', description: 'Mathematics instruction and tutoring', icon: '🔢' },
        { name: 'Science Tutoring', description: 'Physics, chemistry, biology tutoring', icon: '🔬' },
        { name: 'Language Arts', description: 'English, writing, and literature', icon: '📝' },
        { name: 'Foreign Languages', description: 'Spanish, French, Chinese, etc.', icon: '🌍' },
        { name: 'Music Lessons', description: 'Piano, guitar, violin, and more', icon: '🎵' },
        { name: 'Test Prep', description: 'SAT, ACT, GRE preparation', icon: '📚' },
        { name: 'Computer Science', description: 'Programming and computer skills', icon: '💻' },
        { name: 'Art Lessons', description: 'Drawing, painting, and art instruction', icon: '🎨' }
      ],

      // Automotive subcategories
      '68a9b30f7d1647b29f0b068e': [
        { name: 'Auto Repair', description: 'General automotive repairs', icon: '🔧' },
        { name: 'Oil Change', description: 'Oil and filter change services', icon: '🛢️' },
        { name: 'Tire Services', description: 'Tire installation and repair', icon: '🛞' },
        { name: 'Brake Service', description: 'Brake repair and maintenance', icon: '🛑' },
        { name: 'Car Detailing', description: 'Car washing and detailing', icon: '🧽' },
        { name: 'Engine Repair', description: 'Engine diagnostics and repair', icon: '⚙️' },
        { name: 'Body Work', description: 'Collision repair and bodywork', icon: '🚗' },
        { name: 'Transmission', description: 'Transmission repair and service', icon: '⚙️' }
      ],

      // Food & Catering subcategories
      '68a9b30f7d1647b29f0b068f': [
        { name: 'Personal Chef', description: 'Private cooking services', icon: '👨‍🍳' },
        { name: 'Event Catering', description: 'Wedding and event catering', icon: '🎉' },
        { name: 'Meal Prep', description: 'Weekly meal preparation', icon: '🥘' },
        { name: 'Baking', description: 'Custom cakes and baked goods', icon: '🧁' },
        { name: 'Bartending', description: 'Bartender services for events', icon: '🍹' },
        { name: 'Food Truck', description: 'Mobile food services', icon: '🚚' },
        { name: 'Cooking Classes', description: 'Private cooking instruction', icon: '👩‍🍳' },
        { name: 'Specialty Diets', description: 'Vegan, keto, gluten-free cooking', icon: '🥗' }
      ]
    };

    // Process each main category
    for (const [categoryId, subcategoriesData] of Object.entries(categorySubcategories)) {
      console.log(`\n📋 Processing category: ${categoryId}`);

      const mainCategory = await ServiceCategory.findById(categoryId);
      if (!mainCategory) {
        console.log(`❌ Main category ${categoryId} not found`);
        continue;
      }

      console.log(`✅ Found main category: ${mainCategory.name}`);

      const createdSubcategoryIds = [];

      // Create subcategories
      for (const subcatData of subcategoriesData) {
        // Check if subcategory already exists
        const existingSubcat = await ServiceCategory.findOne({
          name: subcatData.name,
          parentCategory: categoryId
        });

        if (!existingSubcat) {
          const newSubcategory = new ServiceCategory({
            name: subcatData.name,
            description: subcatData.description,
            icon: subcatData.icon,
            parentCategory: categoryId,
            isActive: true,
            subcategories: []
          });

          await newSubcategory.save();
          createdSubcategoryIds.push(newSubcategory._id);
          console.log(`  ✅ Created: ${subcatData.name}`);
        } else {
          createdSubcategoryIds.push(existingSubcat._id);
          console.log(`  ⚡ Exists: ${subcatData.name}`);
        }
      }

      // Update main category with subcategory references
      mainCategory.subcategories = createdSubcategoryIds;
      await mainCategory.save();

      console.log(`🎉 Updated ${mainCategory.name} with ${createdSubcategoryIds.length} subcategories`);
    }

    // Test the Health & Wellness subcategories endpoint
    console.log('\n🔍 Testing Health & Wellness subcategories...');
    const healthCategory = await ServiceCategory.findById('68a9b3039e01377b5a45e970')
      .populate('subcategories', 'name');

    if (healthCategory && healthCategory.subcategories) {
      console.log(`Health & Wellness subcategories count: ${healthCategory.subcategories.length}`);
      console.log('Subcategories:', healthCategory.subcategories.map(sub => sub.name).join(', '));
    }

    console.log('\n🎉 All subcategories have been added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  }
};

addAllSubcategories();