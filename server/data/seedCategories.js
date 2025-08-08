import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const categories = [
  {
    name: 'Health & Wellness',
    description: 'Medical, fitness, and wellness services',
    icon: 'heart',
    commonServices: [
      { name: 'General Consultation', description: 'Basic health consultation', averagePrice: 100, averageDuration: 30 },
      { name: 'Physical Therapy', description: 'Rehabilitation and physical therapy', averagePrice: 80, averageDuration: 45 },
      { name: 'Massage Therapy', description: 'Therapeutic massage services', averagePrice: 120, averageDuration: 60 }
    ]
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Beauty treatments, hair, and personal care services',
    icon: 'scissors',
    commonServices: [
      { name: 'Haircut & Styling', description: 'Professional hair cutting and styling', averagePrice: 65, averageDuration: 60 },
      { name: 'Manicure & Pedicure', description: 'Nail care and beauty services', averagePrice: 45, averageDuration: 90 },
      { name: 'Facial Treatment', description: 'Professional facial and skincare', averagePrice: 85, averageDuration: 75 }
    ]
  },
  {
    name: 'Professional Services',
    description: 'Legal, financial, and business consulting services',
    icon: 'briefcase',
    commonServices: [
      { name: 'Legal Consultation', description: 'Legal advice and consultation', averagePrice: 200, averageDuration: 60 },
      { name: 'Tax Preparation', description: 'Tax filing and preparation services', averagePrice: 150, averageDuration: 90 },
      { name: 'Business Consulting', description: 'Strategic business advice', averagePrice: 180, averageDuration: 120 }
    ]
  },
  {
    name: 'Home & Maintenance',
    description: 'Home repair, cleaning, and maintenance services',
    icon: 'wrench',
    commonServices: [
      { name: 'House Cleaning', description: 'Residential cleaning services', averagePrice: 120, averageDuration: 180 },
      { name: 'Plumbing Repair', description: 'General plumbing services', averagePrice: 95, averageDuration: 90 },
      { name: 'Electrical Work', description: 'Electrical installation and repair', averagePrice: 110, averageDuration: 120 }
    ]
  },
  {
    name: 'Education & Training',
    description: 'Tutoring, coaching, and educational services',
    icon: 'book',
    commonServices: [
      { name: 'Private Tutoring', description: 'One-on-one academic tutoring', averagePrice: 50, averageDuration: 60 },
      { name: 'Language Lessons', description: 'Foreign language instruction', averagePrice: 40, averageDuration: 60 },
      { name: 'Music Lessons', description: 'Individual music instrument lessons', averagePrice: 55, averageDuration: 45 }
    ]
  },
  {
    name: 'Technology Services',
    description: 'Computer repair, web development, and tech support',
    icon: 'laptop',
    commonServices: [
      { name: 'Computer Repair', description: 'Hardware and software troubleshooting', averagePrice: 85, averageDuration: 90 },
      { name: 'Web Development', description: 'Website design and development', averagePrice: 150, averageDuration: 180 },
      { name: 'Tech Support', description: 'General technology assistance', averagePrice: 60, averageDuration: 60 }
    ]
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appoint-zenith');
    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    await ServiceCategory.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Insert new categories
    const insertedCategories = await ServiceCategory.insertMany(categories);
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Log the categories
    insertedCategories.forEach(category => {
      console.log(`📋 ${category.name} (${category.commonServices.length} common services)`);
    });

    console.log('🎉 Categories seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();