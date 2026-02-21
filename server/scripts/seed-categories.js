// Run with: node server/scripts/seed-categories.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ServiceCategory from '../models/ServiceCategory.js';

dotenv.config();

const CATEGORIES = [
  {
    name: 'Engine & Mechanical',
    description: 'Engine repair, transmission, clutch, exhaust, suspension and brake services',
    subcategories: [
      'Engine repair & rebuild',
      'Transmission & gearbox',
      'Clutch repair',
      'Exhaust & catalytic converter',
      'Suspension & steering',
      'Brakes',
    ],
  },
  {
    name: 'Body & Paint',
    description: 'Dent and scratch repair, full respray, panel replacement and glass repair',
    subcategories: [
      'Dent & scratch repair',
      'Full respray',
      'Panel replacement',
      'Bumper repair',
      'Window & glass repair',
    ],
  },
  {
    name: 'Electrical & Diagnostics',
    description: 'Battery, ECU diagnostics, wiring, starter motor and sensor services',
    subcategories: [
      'Battery & charging system',
      'ECU diagnostics',
      'Wiring & electrics',
      'Starter motor & alternator',
      'Sensors & modules',
    ],
  },
  {
    name: 'Tyres & Wheels',
    description: 'Tyre fitting, wheel alignment, balancing, puncture repair and alloy refurbishment',
    subcategories: [
      'Tyre fitting & replacement',
      'Wheel alignment & balancing',
      'Puncture repair',
      'Alloy wheel refurbishment',
    ],
  },
  {
    name: 'Air Conditioning',
    description: 'A/C regas, compressor repair, climate control and cabin filter services',
    subcategories: [
      'A/C regas & recharge',
      'A/C compressor repair',
      'Climate control service',
      'Cabin air filter replacement',
    ],
  },
  {
    name: 'Servicing & MOT',
    description: 'Full and interim service, oil change, MOT test and MOT preparation',
    subcategories: [
      'Full service',
      'Interim service',
      'Oil & filter change',
      'MOT test',
      'MOT preparation check',
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zenith');
    console.log('Connected to MongoDB');

    // Remove all existing categories
    await ServiceCategory.deleteMany({});
    console.log('Cleared existing categories');

    for (const categoryData of CATEGORIES) {
      // Create the parent category first
      const parent = await ServiceCategory.create({
        name: categoryData.name,
        description: categoryData.description,
        isActive: true,
      });

      // Create each subcategory and link to parent
      const subcategoryIds = [];
      for (const subName of categoryData.subcategories) {
        const sub = await ServiceCategory.create({
          name: subName,
          parentCategory: parent._id,
          isActive: true,
        });
        subcategoryIds.push(sub._id);
      }

      // Update parent with subcategory references
      parent.subcategories = subcategoryIds;
      await parent.save();

      console.log(`Created: ${categoryData.name} (${subcategoryIds.length} subcategories)`);
    }

    console.log('Seed complete.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
