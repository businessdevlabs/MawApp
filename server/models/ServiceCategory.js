import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  }],
  commonServices: [{
    name: String,
    description: String,
    averagePrice: Number,
    averageDuration: Number
  }]
}, {
  timestamps: true
});

serviceCategorySchema.index({ name: 1, isActive: 1 });

export default mongoose.model('ServiceCategory', serviceCategorySchema);