import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 15
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'bank_transfer'],
    default: 'card'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Cancellation fields
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  
  // Completion fields
  completedAt: Date,
  
  // Reminder fields
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date
});

// Index for efficient queries
bookingSchema.index({ clientId: 1, appointmentDate: -1 });
bookingSchema.index({ providerId: 1, appointmentDate: -1 });
bookingSchema.index({ appointmentDate: 1, status: 1 });
bookingSchema.index({ status: 1, appointmentDate: 1 });

// Virtual for appointment datetime
bookingSchema.virtual('appointmentDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Pre-save middleware to update updatedAt
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  
  // Can't cancel if appointment is in less than 24 hours
  const appointmentDateTime = this.appointmentDateTime;
  const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return appointmentDateTime > twentyFourHoursFromNow;
};

// Instance method to check if booking is upcoming
bookingSchema.methods.isUpcoming = function() {
  const now = new Date();
  return this.appointmentDateTime > now && (this.status === 'pending' || this.status === 'confirmed');
};

// Instance method to check if booking is today
bookingSchema.methods.isToday = function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  
  return today.getFullYear() === appointmentDate.getFullYear() &&
         today.getMonth() === appointmentDate.getMonth() &&
         today.getDate() === appointmentDate.getDate();
};

// Static method to get upcoming bookings for a client
bookingSchema.statics.getUpcomingForClient = function(clientId) {
  console.log('getUpcomingForClient called with clientId:', clientId);
  console.log('clientId type:', typeof clientId);
  
  const now = new Date();
  // Set to start of today to include today's appointments
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  console.log('Searching for bookings from date:', today);
  
  // Simplify ObjectId handling - MongoDB can handle strings directly
  let queryClientId = clientId;
  if (typeof clientId === 'string' && mongoose.Types.ObjectId.isValid(clientId)) {
    // Don't convert to ObjectId, let MongoDB handle it
    queryClientId = clientId;
  }
  
  const query = {
    clientId: queryClientId,
    appointmentDate: { $gte: today },
    status: { $in: ['pending', 'confirmed'] }
  };
  
  console.log('Query:', JSON.stringify(query, null, 2));
  
  return this.find(query)
  .populate('providerId', 'businessName businessAddress businessPhone')
  .populate('serviceId', 'name description price duration')
  .sort({ appointmentDate: 1, startTime: 1 })
  .limit(10);
};

// Static method to get upcoming bookings for a provider
bookingSchema.statics.getUpcomingForProvider = function(providerId) {
  const now = new Date();
  // Set to start of today to include today's apartments
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Simplify ObjectId handling - MongoDB can handle strings directly
  let queryProviderId = providerId;
  if (typeof providerId === 'string' && mongoose.Types.ObjectId.isValid(providerId)) {
    queryProviderId = providerId;
  }
  
  return this.find({
    providerId: queryProviderId,
    appointmentDate: { $gte: today },
    status: { $in: ['pending', 'confirmed'] }
  })
  .populate('clientId', 'fullName phone email')
  .populate('serviceId', 'name description price duration')
  .sort({ appointmentDate: 1, startTime: 1 })
  .limit(10);
};

// Static method to get booking statistics
bookingSchema.statics.getStatsForProvider = function(providerId, startDate, endDate) {
  const match = { providerId };
  if (startDate || endDate) {
    match.appointmentDate = {};
    if (startDate) match.appointmentDate.$gte = startDate;
    if (endDate) match.appointmentDate.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] }
        },
        averageBookingValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

export default mongoose.model('Booking', bookingSchema);