import express from 'express';
import { body, validationResult, param } from 'express-validator';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get admin dashboard statistics
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get total counts
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalProviders = await ServiceProvider.countDocuments();
    const pendingProviders = await ServiceProvider.countDocuments({ status: 'pending' });
    const approvedProviders = await ServiceProvider.countDocuments({ status: 'approved' });
    const totalBookings = await Booking.countDocuments();
    
    // Calculate total revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.json({
      totalClients,
      totalProviders,
      pendingProviders,
      approvedProviders,
      totalBookings,
      totalRevenue
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Get all users with pagination and filtering
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};
    if (role && ['client', 'provider', 'admin'].includes(role)) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all providers with pagination and filtering
router.get('/providers', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};
    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const providers = await ServiceProvider.find(query)
      .populate('userId', 'fullName email phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceProvider.countDocuments(query);

    res.json({
      providers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProviders: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Update user role
router.put('/users/:userId/role', [
  authenticateToken,
  requireRole(['admin']),
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').isIn(['client', 'provider', 'admin']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (userId === req.user._id && req.user.role === 'admin') {
      return res.status(400).json({ 
        error: 'Cannot change your own admin role' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Update provider status
router.put('/providers/:providerId/status', [
  authenticateToken,
  requireRole(['admin']),
  param('providerId').isMongoId().withMessage('Valid provider ID is required'),
  body('status').isIn(['pending', 'approved', 'rejected', 'suspended']).withMessage('Valid status is required'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { providerId } = req.params;
    const { status, reason } = req.body;

    const provider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { 
        status,
        ...(reason && { statusReason: reason }),
        statusUpdatedAt: new Date(),
        statusUpdatedBy: req.user._id
      },
      { new: true }
    ).populate('userId', 'fullName email phone');

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // TODO: Send notification email to provider about status change

    res.json({
      message: 'Provider status updated successfully',
      provider
    });

  } catch (error) {
    console.error('Update provider status error:', error);
    res.status(500).json({ error: 'Failed to update provider status' });
  }
});

// Suspend/unsuspend user
router.put('/users/:userId/suspend', [
  authenticateToken,
  requireRole(['admin']),
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('suspended').isBoolean().withMessage('Suspended must be a boolean'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { userId } = req.params;
    const { suspended, reason } = req.body;

    // Prevent admin from suspending themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Cannot suspend your own account' 
      });
    }

    const updateData = {
      suspended,
      suspendedAt: suspended ? new Date() : null,
      suspendedBy: suspended ? req.user._id : null,
      ...(reason && { suspensionReason: reason })
    };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
      user
    });

  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Failed to update user suspension status' });
  }
});

// Get recent bookings for admin dashboard
router.get('/bookings/recent', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const bookings = await Booking.find()
      .populate('clientId', 'fullName email')
      .populate('providerId', 'businessName businessEmail')
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ bookings });

  } catch (error) {
    console.error('Get recent bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
});

// Get platform analytics
router.get('/analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchFilter = {};
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Monthly revenue trend
    const monthlyRevenue = await Booking.aggregate([
      { $match: { status: 'completed', ...matchFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top services
    const topServices = await Booking.aggregate([
      ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
      {
        $group: {
          _id: '$serviceId',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' }
    ]);

    res.json({
      bookingsByStatus,
      monthlyRevenue,
      topServices
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Delete user (soft delete - mark as inactive)
router.delete('/users/:userId', [
  authenticateToken,
  requireRole(['admin']),
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account' 
      });
    }

    // Soft delete - mark as inactive instead of actually deleting
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        ...(reason && { deletionReason: reason })
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User account deactivated successfully',
      user
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user account' });
  }
});

export default router;