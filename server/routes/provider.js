import express from 'express';
import { body, validationResult } from 'express-validator';
import ServiceProvider from '../models/ServiceProvider.js';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProviderSchedule from '../models/ProviderSchedule.js';
import Booking from '../models/Booking.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get provider profile
router.get('/profile', authenticateToken, requireRole(['provider']), async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ userId: req.user._id }).populate('services');
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    res.json({ provider });
  } catch (error) {
    console.error('Get provider profile error:', error);
    res.status(500).json({ error: 'Failed to fetch provider profile' });
  }
});

// Update provider profile
router.put('/profile', [
  authenticateToken,
  requireRole(['provider']),
  body('businessName').trim().isLength({ min: 2 }),
  body('businessDescription').trim().isLength({ min: 10 }).withMessage('Business description must be at least 10 characters'),
  body('businessAddress').trim().isLength({ min: 5 }).withMessage('Business address is required'),
  body('businessPhone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('website').optional().isURL(),
  body('category').optional().isMongoId(),
  body('coordinates').optional(),
  body('coordinates.lat').optional(),
  body('coordinates.lng').optional()
], async (req, res) => {
  try {
    console.log('Provider profile update request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const {
      businessName,
      businessDescription,
      businessAddress,
      businessPhone,
      website,
      category,
      businessHours,
      coordinates
    } = req.body;

    // BusinessEmail is not allowed to be updated - it's set to the user's email and should remain unchanged

    // Validate category if provided
    if (category) {
      const categoryExists = await ServiceCategory.findById(category);
      if (!categoryExists || !categoryExists.isActive) {
        return res.status(400).json({ error: 'Invalid category selected' });
      }
    }

    console.log('Updating provider with data:', {
      businessName,
      businessDescription,
      businessAddress,
      businessPhone,
      website,
      category,
      businessHours,
      coordinates
    });

    console.log('Coordinates type check:', {
      coordinates,
      hasCoordinates: !!coordinates,
      hasLat: coordinates && coordinates.lat !== undefined,
      hasLng: coordinates && coordinates.lng !== undefined,
      latValue: coordinates?.lat,
      lngValue: coordinates?.lng
    });

    // Handle coordinates separately if they exist
    const updateData = {
      businessName,
      businessDescription,
      businessAddress,
      businessPhone,
      website,
      category,
      businessHours
    };

    if (coordinates && coordinates.lat !== undefined && coordinates.lng !== undefined) {
      updateData.coordinates = {
        lat: coordinates.lat,
        lng: coordinates.lng
      };
      console.log('Adding coordinates to update:', coordinates);
      console.log('Full update data:', updateData);
    } else {
      console.log('Coordinates not added to update. Received coordinates:', coordinates);
    }

    const updatedProvider = await ServiceProvider.findByIdAndUpdate(
      provider._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('services').populate('category', 'name description');

    console.log('Updated provider result:', {
      id: updatedProvider._id,
      coordinates: updatedProvider.coordinates,
      businessAddress: updatedProvider.businessAddress
    });

    res.json({
      message: 'Provider profile updated successfully',
      provider: updatedProvider
    });

  } catch (error) {
    console.error('Update provider profile error:', error);
    res.status(500).json({ error: 'Failed to update provider profile' });
  }
});

// Get provider services
router.get('/services', authenticateToken, requireRole(['provider']), async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const services = await Service.find({ providerId: provider._id })
      .populate('category', 'name description');
    
    res.json({ services });
  } catch (error) {
    console.error('Get provider services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create new service
router.post('/services', [
  authenticateToken,
  requireRole(['provider']),
  body('name').trim().isLength({ min: 2 }),
  body('description').trim().isLength({ min: 10 }),
  body('category').isMongoId(),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('duration').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const {
      name,
      description,
      category,
      price,
      duration,
      maxBookingsPerDay,
      requirements,
      tags
    } = req.body;

    // Validate category
    const categoryExists = await ServiceCategory.findById(category);
    if (!categoryExists || !categoryExists.isActive) {
      return res.status(400).json({ error: 'Invalid category selected' });
    }

    const service = new Service({
      providerId: provider._id,
      name,
      description,
      category,
      price,
      duration,
      maxBookingsPerDay,
      requirements,
      tags
    });

    await service.save();

    // Add service to provider's services array
    provider.services.push(service._id);
    await provider.save();

    const populatedService = await Service.findById(service._id)
      .populate('category', 'name description');

    res.status(201).json({
      message: 'Service created successfully',
      service: populatedService
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
router.put('/services/:serviceId', [
  authenticateToken,
  requireRole(['provider']),
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('category').optional().isMongoId(),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('duration').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const service = await Service.findOne({ 
      _id: req.params.serviceId,
      providerId: provider._id 
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Validate category if being updated
    if (req.body.category) {
      const categoryExists = await ServiceCategory.findById(req.body.category);
      if (!categoryExists || !categoryExists.isActive) {
        return res.status(400).json({ error: 'Invalid category selected' });
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.serviceId,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name description');

    res.json({
      message: 'Service updated successfully',
      service: updatedService
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service
router.delete('/services/:serviceId', authenticateToken, requireRole(['provider']), async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const service = await Service.findOne({ 
      _id: req.params.serviceId,
      providerId: provider._id 
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await Service.findByIdAndDelete(req.params.serviceId);

    // Remove service from provider's services array
    provider.services.pull(req.params.serviceId);
    await provider.save();

    res.json({ message: 'Service deleted successfully' });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get provider schedule
router.get('/schedule', authenticateToken, requireRole(['provider']), async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const schedules = await ProviderSchedule.find({ providerId: provider._id })
      .sort({ dayOfWeek: 1 });
    
    res.json({ schedules });
  } catch (error) {
    console.error('Get provider schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Create or update provider schedule
router.post('/schedule', [
  authenticateToken,
  requireRole(['provider']),
  body('schedules').isArray(),
  body('schedules.*.dayOfWeek').isInt({ min: 0, max: 6 }),
  body('schedules.*.isAvailable').isBoolean(),
  body('schedules.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('schedules.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const { schedules } = req.body;
    const savedSchedules = [];

    for (const scheduleData of schedules) {
      const { dayOfWeek, isAvailable, startTime, endTime } = scheduleData;

      // Validate that end time is after start time
      if (isAvailable && startTime >= endTime) {
        return res.status(400).json({ 
          error: `End time must be after start time for day ${dayOfWeek}` 
        });
      }

      const schedule = await ProviderSchedule.findOneAndUpdate(
        { providerId: provider._id, dayOfWeek },
        {
          providerId: provider._id,
          dayOfWeek,
          isAvailable,
          startTime,
          endTime
        },
        { 
          new: true, 
          upsert: true, 
          runValidators: true 
        }
      );

      savedSchedules.push(schedule);
    }

    res.json({
      message: 'Schedule updated successfully',
      schedules: savedSchedules
    });

  } catch (error) {
    console.error('Update provider schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Delete schedule for a specific day
router.delete('/schedule/:dayOfWeek', authenticateToken, requireRole(['provider']), async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const dayOfWeek = parseInt(req.params.dayOfWeek);
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Invalid day of week' });
    }

    await ProviderSchedule.findOneAndDelete({ 
      providerId: provider._id, 
      dayOfWeek 
    });

    res.json({ message: 'Schedule deleted successfully' });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Get provider payments (completed bookings with payment info)
router.get('/payments', authenticateToken, requireRole(['provider']), async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const provider = await ServiceProvider.findOne({ userId: req.user._id });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    // Build query for completed bookings (which represent payments)
    const query = {
      providerId: provider._id,
      status: 'completed',
      paymentStatus: 'paid'
    };

    // Add date filtering if provided
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        query.appointmentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.appointmentDate.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch payments (completed bookings) with populated fields
    const payments = await Booking.find(query)
      .populate('clientId', 'fullName email phone')
      .populate('serviceId', 'name description duration price')
      .sort({ completedAt: -1, appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalPayments = await Booking.countDocuments(query);

    // Transform bookings into payment format expected by frontend
    const transformedPayments = payments.map(booking => {
      // Calculate platform fee (assuming 5% fee)
      const platformFeeRate = 0.05;
      const platformFee = booking.totalAmount * platformFeeRate;
      const netAmount = booking.totalAmount - platformFee;

      return {
        _id: booking._id,
        bookingId: {
          _id: booking._id,
          clientId: booking.clientId,
          serviceId: booking.serviceId,
          appointmentDate: booking.appointmentDate,
          startTime: booking.startTime
        },
        amount: booking.totalAmount,
        paymentMethod: booking.paymentMethod || 'card',
        status: 'completed',
        transactionId: `txn_${booking._id.toString().slice(-10)}`,
        paymentDate: booking.completedAt || booking.updatedAt,
        platformFee: parseFloat(platformFee.toFixed(2)),
        netAmount: parseFloat(netAmount.toFixed(2))
      };
    });

    // Calculate summary statistics
    const totalRevenue = transformedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalFees = transformedPayments.reduce((sum, payment) => sum + payment.platformFee, 0);
    const totalNetRevenue = transformedPayments.reduce((sum, payment) => sum + payment.netAmount, 0);

    res.json({
      payments: transformedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayments / parseInt(limit)),
        totalPayments,
        limit: parseInt(limit)
      },
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalFees: parseFloat(totalFees.toFixed(2)),
        totalNetRevenue: parseFloat(totalNetRevenue.toFixed(2)),
        averagePayment: totalPayments > 0 ? parseFloat((totalRevenue / totalPayments).toFixed(2)) : 0
      }
    });

  } catch (error) {
    console.error('Get provider payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;