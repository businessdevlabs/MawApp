import mongoose from 'mongoose';

const providerScheduleSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sunday, 1 = Monday, etc.
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  }
}, {
  timestamps: true
});

// Ensure one schedule entry per provider per day
providerScheduleSchema.index({ providerId: 1, dayOfWeek: 1 }, { unique: true });

export default mongoose.model('ProviderSchedule', providerScheduleSchema);