import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  }
}, { _id: false });

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
  timeSlots: {
    type: [timeSlotSchema],
    default: []
  },
  // Keep legacy fields for backward compatibility during transition
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: false
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: false
  }
}, {
  timestamps: true
});

// Ensure one schedule entry per provider per day
providerScheduleSchema.index({ providerId: 1, dayOfWeek: 1 }, { unique: true });

// Virtual to handle backward compatibility
providerScheduleSchema.virtual('hasTimeSlots').get(function() {
  return this.timeSlots && this.timeSlots.length > 0;
});

// Pre-save middleware to handle migration from single slot to multiple slots
providerScheduleSchema.pre('save', function(next) {
  // If timeSlots is empty but startTime/endTime exist, migrate to timeSlots
  if ((!this.timeSlots || this.timeSlots.length === 0) && this.startTime && this.endTime) {
    this.timeSlots = [{
      startTime: this.startTime,
      endTime: this.endTime
    }];
  }
  next();
});

export default mongoose.model('ProviderSchedule', providerScheduleSchema);