import mongoose from 'mongoose';
import ServiceCategory from '../server/models/ServiceCategory.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const categories = [
  {
    name: 'Health & Wellness',
    description: 'Medical appointments, therapy sessions, and wellness services',
    icon: '🏥',
    commonServices: [
      { name: 'General Checkup', description: 'Routine medical examination', averagePrice: 150, averageDuration: 30 },
      { name: 'Dental Cleaning', description: 'Professional teeth cleaning', averagePrice: 120, averageDuration: 60 },
      { name: 'Physical Therapy', description: 'Rehabilitation and exercise therapy', averagePrice: 100, averageDuration: 60 },
      { name: 'Massage Therapy', description: 'Therapeutic massage session', averagePrice: 80, averageDuration: 90 }
    ]
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Hair salons, nail care, skincare, and beauty treatments',
    icon: '💅',
    commonServices: [
      { name: 'Haircut & Style', description: 'Professional hair cutting and styling', averagePrice: 60, averageDuration: 90 },
      { name: 'Manicure', description: 'Nail care and polish application', averagePrice: 35, averageDuration: 45 },
      { name: 'Pedicure', description: 'Foot care and nail treatment', averagePrice: 45, averageDuration: 60 },
      { name: 'Facial Treatment', description: 'Deep cleansing facial therapy', averagePrice: 80, averageDuration: 75 }
    ]
  },
  {
    name: 'Fitness & Sports',
    description: 'Personal training, group classes, and sports activities',
    icon: '💪',
    commonServices: [
      { name: 'Personal Training', description: 'One-on-one fitness training session', averagePrice: 75, averageDuration: 60 },
      { name: 'Group Fitness Class', description: 'Structured group exercise session', averagePrice: 25, averageDuration: 60 },
      { name: 'Yoga Session', description: 'Individual or group yoga practice', averagePrice: 30, averageDuration: 75 },
      { name: 'Sports Coaching', description: 'Professional sports skill development', averagePrice: 65, averageDuration: 90 }
    ]
  },
  {
    name: 'Professional Services',
    description: 'Legal, financial, consulting, and business services',
    icon: '💼',
    commonServices: [
      { name: 'Legal Consultation', description: 'Professional legal advice session', averagePrice: 250, averageDuration: 60 },
      { name: 'Financial Planning', description: 'Personal financial advisory meeting', averagePrice: 150, averageDuration: 90 },
      { name: 'Business Consulting', description: 'Strategic business advice session', averagePrice: 200, averageDuration: 120 },
      { name: 'Tax Preparation', description: 'Professional tax filing service', averagePrice: 175, averageDuration: 90 }
    ]
  },
  {
    name: 'Home & Maintenance',
    description: 'Home repairs, cleaning, landscaping, and maintenance services',
    icon: '🏠',
    commonServices: [
      { name: 'House Cleaning', description: 'Comprehensive home cleaning service', averagePrice: 120, averageDuration: 180 },
      { name: 'Plumbing Repair', description: 'Professional plumbing fixes', averagePrice: 85, averageDuration: 120 },
      { name: 'Landscaping', description: 'Garden and lawn maintenance', averagePrice: 95, averageDuration: 240 },
      { name: 'Electrical Work', description: 'Electrical installation and repairs', averagePrice: 110, averageDuration: 90 }
    ]
  },
  {
    name: 'Education & Tutoring',
    description: 'Private tutoring, lessons, and educational services',
    icon: '📚',
    commonServices: [
      { name: 'Math Tutoring', description: 'Individual mathematics instruction', averagePrice: 50, averageDuration: 60 },
      { name: 'Language Lessons', description: 'Foreign language instruction', averagePrice: 45, averageDuration: 60 },
      { name: 'Music Lessons', description: 'Individual instrument or voice lessons', averagePrice: 60, averageDuration: 60 },
      { name: 'Test Prep', description: 'Standardized test preparation', averagePrice: 70, averageDuration: 90 }
    ]
  },
  {
    name: 'Automotive',
    description: 'Car maintenance, repairs, and automotive services',
    icon: '🚗',
    commonServices: [
      { name: 'Oil Change', description: 'Engine oil and filter replacement', averagePrice: 45, averageDuration: 30 },
      { name: 'Car Wash & Detail', description: 'Comprehensive vehicle cleaning', averagePrice: 75, averageDuration: 120 },
      { name: 'Brake Service', description: 'Brake inspection and repair', averagePrice: 180, averageDuration: 90 },
      { name: 'Tire Installation', description: 'New tire mounting and balancing', averagePrice: 25, averageDuration: 45 }
    ]
  },
  {
    name: 'Food & Catering',
    description: 'Personal chefs, catering, and food services',
    icon: '🍽️',
    commonServices: [
      { name: 'Personal Chef', description: 'Private cooking service', averagePrice: 150, averageDuration: 180 },
      { name: 'Event Catering', description: 'Food service for events', averagePrice: 30, averageDuration: 240 },
      { name: 'Meal Prep', description: 'Weekly meal preparation service', averagePrice: 120, averageDuration: 240 },
      { name: 'Cooking Lessons', description: 'Private culinary instruction', averagePrice: 80, averageDuration: 120 }
    ]
  }
];

async function seedCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if categories already exist
    const existingCount = await ServiceCategory.countDocuments();
    console.log(`Found ${existingCount} existing categories`);

    if (existingCount > 0) {
      console.log('⚠️ Categories already exist. Skipping seed to avoid duplicates.');
      console.log('If you want to reset categories, delete them first.');
      await mongoose.disconnect();
      return;
    }

    console.log('Adding categories to database...');
    
    for (const categoryData of categories) {
      const category = new ServiceCategory(categoryData);
      await category.save();
      console.log(`✅ Added category: ${categoryData.name}`);
    }

    console.log('🎉 Successfully added all categories!');
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedCategories();