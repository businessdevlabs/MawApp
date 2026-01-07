import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import ClientSchedule from '../models/ClientSchedule.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get client profile
router.get('/profile', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const client = await User.findById(req.user._id).select('-password');

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Get client schedule/availability
    const schedule = await ClientSchedule.findOne({ clientId: req.user._id });

    res.json({
      client: {
        ...client.toJSON(),
        schedule: schedule?.slots || []
      }
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ error: 'Failed to fetch client profile' });
  }
});

// Update client profile
router.put('/profile', [
  authenticateToken,
  requireRole(['client']),
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().trim().isLength({ min: 10 }),
  body('email').optional().isEmail(),
  body('address').optional().trim(),
  body('schedule').optional().isArray(),
  body('schedule.*').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { fullName, phone, email, address, schedule } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (address) updateData.address = address;

    // Update user profile
    const updatedClient = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    // Handle schedule update if provided
    let updatedSchedule = null;
    if (schedule !== undefined) {
      // Validate each slot is proper JSON format
      if (schedule.length > 0) {
        for (const slot of schedule) {
          try {
            const parsed = JSON.parse(slot);
            if (typeof parsed.dayOfWeek !== 'number' ||
                typeof parsed.startTime !== 'string' ||
                typeof parsed.endTime !== 'string') {
              return res.status(400).json({
                error: 'Invalid slot format'
              });
            }

            // Validate that end time is after start time
            if (parsed.startTime >= parsed.endTime) {
              return res.status(400).json({
                error: `End time must be after start time for day ${parsed.dayOfWeek}`
              });
            }
          } catch (error) {
            return res.status(400).json({
              error: 'Invalid JSON format in schedule slots'
            });
          }
        }
      }

      // Update or create schedule
      updatedSchedule = await ClientSchedule.findOneAndUpdate(
        { clientId: req.user._id },
        {
          clientId: req.user._id,
          slots: schedule
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );
    } else {
      // If schedule not provided, get existing schedule
      updatedSchedule = await ClientSchedule.findOne({ clientId: req.user._id });
    }

    res.json({
      message: 'Client profile updated successfully',
      client: {
        ...updatedClient.toJSON(),
        schedule: updatedSchedule?.slots || []
      }
    });

  } catch (error) {
    console.error('Update client profile error:', error);
    res.status(500).json({ error: 'Failed to update client profile' });
  }
});

// Get client schedule/availability
router.get('/schedule', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const schedule = await ClientSchedule.findOne({ clientId: req.user._id });

    res.json({ slots: schedule?.slots || [] });
  } catch (error) {
    console.error('Get client schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Create or update client schedule/availability
router.post('/schedule', [
  authenticateToken,
  requireRole(['client']),
  body('slots').isArray(),
  body('slots.*').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { slots } = req.body;

    // Validate each slot is proper JSON format
    for (const slot of slots) {
      try {
        const parsed = JSON.parse(slot);
        if (typeof parsed.dayOfWeek !== 'number' ||
            typeof parsed.startTime !== 'string' ||
            typeof parsed.endTime !== 'string') {
          return res.status(400).json({
            error: 'Invalid slot format'
          });
        }

        // Validate that end time is after start time
        if (parsed.startTime >= parsed.endTime) {
          return res.status(400).json({
            error: `End time must be after start time for day ${parsed.dayOfWeek}`
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid JSON format in slots'
        });
      }
    }

    const schedule = await ClientSchedule.findOneAndUpdate(
      { clientId: req.user._id },
      {
        clientId: req.user._id,
        slots
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      message: 'Schedule updated successfully',
      slots: schedule.slots
    });

  } catch (error) {
    console.error('Update client schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Delete all client schedule
router.delete('/schedule', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    await ClientSchedule.findOneAndDelete({
      clientId: req.user._id
    });

    res.json({ message: 'Schedule deleted successfully' });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

export default router;