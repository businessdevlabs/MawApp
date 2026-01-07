import mongoose from 'mongoose';

const clientScheduleSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slots: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
clientScheduleSchema.index({ clientId: 1 }, { unique: true });

export default mongoose.model('ClientSchedule', clientScheduleSchema);