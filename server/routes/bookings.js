import express from 'express';
import { body, validationResult, param } from 'express-validator';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import ServiceProvider from '../models/ServiceProvider.js';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Helper function to calculate end time
const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

// Helper function to check for booking conflicts
const hasTimeConflict = async (providerId, appointmentDate, startTime, endTime, excludeBookingId = null) => {
  const query = {
    providerId,
    appointmentDate,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await Booking.find(query);
  return conflictingBookings.length > 0;
};

// GET /api/bookings - Get bookings for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by user role
    if (req.user.role === 'client') {
      query.clientId = req.user._id;
    } else if (req.user.role === 'provider') {
      // Get provider profile
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!provider) {
        return res.status(404).json({ error: 'Provider profile not found' });
      }
      query.providerId = provider._id;
    } else {
      // Admin can see all bookings
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('clientId', 'fullName phone email')
      .populate('providerId', 'businessName businessAddress businessPhone')
      .populate('serviceId', 'name description price duration')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/upcoming - Get upcoming bookings for authenticated user
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    console.log('Getting upcoming bookings for user:', {
      _id: req.user._id,
      role: req.user.role,
      userObject: req.user
    });

    let bookings;
    
    if (req.user.role === 'client') {
      const userId = req.user._id;
      console.log('Calling getUpcomingForClient with ID:', userId);
      bookings = await Booking.getUpcomingForClient(userId);
    } else if (req.user.role === 'provider') {
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!provider) {
        return res.status(404).json({ error: 'Provider profile not found' });
      }
      bookings = await Booking.getUpcomingForProvider(provider._id);
    } else {
      // Admin gets recent upcoming bookings
      const now = new Date();
      bookings = await Booking.find({
        appointmentDate: { $gte: now },
        status: { $in: ['pending', 'confirmed'] }
      })
      .populate('clientId', 'fullName phone email')
      .populate('providerId', 'businessName businessAddress businessPhone')
      .populate('serviceId', 'name description price duration')
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(10);
    }

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming bookings' });
  }
});

// GET /api/bookings/stats - Get booking statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    // For total bookings count, include future bookings by extending end date to far future
    // Only use current date if explicitly filtering by endDate
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear() + 1, 11, 31);

    let stats = {};

    if (req.user.role === 'client') {
      // Client stats
      const clientStats = await Booking.aggregate([
        {
          $match: {
            clientId: req.user._id,
            appointmentDate: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalSpent: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } },
            averageSpent: { $avg: '$totalAmount' }
          }
        }
      ]);

      stats = clientStats[0] || {
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
        averageSpent: 0
      };

      // Get favorite providers count
      const favoriteProviders = await Booking.distinct('providerId', {
        clientId: req.user._id,
        status: 'completed'
      });
      stats.favoriteProviders = favoriteProviders.length;

    } else if (req.user.role === 'provider') {
      // Provider stats
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!provider) {
        return res.status(404).json({ error: 'Provider profile not found' });
      }

      const providerStats = await Booking.getStatsForProvider(provider._id, start, end);
      stats = providerStats[0] || {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0
      };

      // Get unique clients
      const uniqueClients = await Booking.distinct('clientId', {
        providerId: provider._id,
        appointmentDate: { $gte: start, $lte: end }
      });
      stats.totalClients = uniqueClients.length;

      // Get average rating (from provider profile)
      stats.averageRating = provider.averageRating || 0;
      stats.totalReviews = provider.totalReviews || 0;

    } else {
      // Admin stats - platform-wide
      const adminStats = await Booking.aggregate([
        {
          $match: {
            appointmentDate: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } },
            averageBookingValue: { $avg: '$totalAmount' }
          }
        }
      ]);

      stats = adminStats[0] || {
        totalBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0
      };

      stats.totalClients = await User.countDocuments({ role: 'client' });
      stats.totalProviders = await ServiceProvider.countDocuments({ status: 'approved' });
    }

    // Calculate monthly growth (simplified - comparing with previous month)
    const previousMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const previousMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);

    let previousStats = {};
    if (req.user.role === 'provider') {
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      const prevStats = await Booking.getStatsForProvider(provider._id, previousMonthStart, previousMonthEnd);
      previousStats = prevStats[0] || { totalBookings: 0, totalRevenue: 0 };
    } else {
      // Simplified for client/admin
      previousStats = { totalBookings: 0, totalRevenue: 0 };
    }

    stats.monthlyGrowth = {
      bookings: previousStats.totalBookings > 0 
        ? Math.round(((stats.totalBookings - previousStats.totalBookings) / previousStats.totalBookings) * 100)
        : 0,
      revenue: previousStats.totalRevenue > 0
        ? Math.round(((stats.totalRevenue || stats.totalSpent || 0) - previousStats.totalRevenue) / previousStats.totalRevenue * 100)
        : 0,
      clients: 0 // Simplified for now
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ error: 'Failed to fetch booking statistics' });
  }
});

// POST /api/bookings - Create new booking
router.post('/', [
  authenticateToken,
  body('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
  body('notes').optional().isLength({max: 500}).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { serviceId, appointmentDate, startTime, notes } = req.body;

    // Only clients can create bookings
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can create bookings' });
    }

    // Get service details
    const service = await Service.findById(serviceId).populate('providerId');
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.isActive) {
      return res.status(400).json({ error: 'Service is not available' });
    }

    const providerId = service.providerId._id;
    const durationMinutes = service.duration;
    const endTime = calculateEndTime(startTime, durationMinutes);

    // Check for time conflicts
    const hasConflict = await hasTimeConflict(providerId, new Date(appointmentDate), startTime, endTime);
    if (hasConflict) {
      return res.status(409).json({ error: 'Time slot is not available' });
    }

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(`${appointmentDate}T${startTime}:00`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ error: 'Appointment must be in the future' });
    }

    // Create booking
    const booking = new Booking({
      clientId: req.user._id,
      providerId: providerId,
      serviceId: serviceId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      durationMinutes,
      totalAmount: service.price,
      notes: notes || undefined,
      status: 'pending'
    });

    await booking.save();

    // Populate the booking before returning
    const populatedBooking = await Booking.findById(booking._id)
      .populate('clientId', 'fullName phone email')
      .populate('providerId', 'businessName businessAddress businessPhone')
      .populate('serviceId', 'name description price duration');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Valid booking ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('clientId', 'fullName phone email')
      .populate('providerId', 'businessName businessAddress businessPhone')
      .populate('serviceId', 'name description price duration');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user can access this booking
    if (req.user.role === 'client' && booking.clientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'provider') {
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!provider || booking.providerId._id.toString() !== provider._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', [
  authenticateToken,
  param('id').isMongoId().withMessage('Valid booking ID is required'),
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).withMessage('Valid status is required'),
  body('cancellationReason').optional().isLength({max: 200}).withMessage('Cancellation reason must be less than 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check permissions
    let canUpdate = false;
    if (req.user.role === 'admin') {
      canUpdate = true;
    } else if (req.user.role === 'provider') {
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      canUpdate = provider && booking.providerId.toString() === provider._id.toString();
    } else if (req.user.role === 'client' && status === 'cancelled') {
      canUpdate = booking.clientId.toString() === req.user._id.toString();
    }

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status transitions
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot update completed or cancelled booking' });
    }

    if (status === 'cancelled' && !booking.canBeCancelled()) {
      return res.status(400).json({ error: 'Cannot cancel booking less than 24 hours before appointment' });
    }

    // Update booking
    booking.status = status;
    
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user._id;
      booking.cancellationReason = cancellationReason;
    } else if (status === 'completed') {
      booking.completedAt = new Date();
      booking.paymentStatus = 'paid'; // Automatically mark payment as paid when service is completed
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('clientId', 'fullName phone email')
      .populate('providerId', 'businessName businessAddress businessPhone')
      .populate('serviceId', 'name description price duration');

    res.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// DELETE /api/bookings/:id - Delete booking (admin only)
router.delete('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Valid booking ID is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;