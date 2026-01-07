import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import aiBookingService from '../services/aiBookingService.js';

const router = express.Router();

// Generate AI booking suggestions
router.post('/suggestions', [
  authenticateToken,
  requireRole(['client']),
  body('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('frequencyPerMonth').isInt({ min: 1, max: 12 }).withMessage('Frequency must be between 1-12 per month'),
  body('autoBook').optional().isBoolean().withMessage('AutoBook must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { serviceId, frequencyPerMonth, autoBook = false } = req.body;
    const clientId = req.user._id;

    console.log('AI Booking Request:', {
      clientId: clientId.toString(),
      serviceId,
      frequencyPerMonth,
      autoBook
    });

    // Generate AI suggestions
    const result = await aiBookingService.generateBookingSuggestions(
      clientId,
      serviceId,
      frequencyPerMonth
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate booking suggestions',
        details: result.error
      });
    }

    // Auto-book if requested
    let finalResult = result;
    if (autoBook && result.suggestions.length > 0) {
      finalResult = await aiBookingService.autoBookAppointments(
        clientId,
        serviceId,
        result.suggestions,
        autoBook
      );
    }

    res.json({
      message: autoBook ? 'AI booking suggestions generated and appointments auto-booked' : 'AI booking suggestions generated successfully',
      ...finalResult,
      totalSuggestions: result.suggestions.length,
      clientId: clientId.toString(),
      serviceId
    });

  } catch (error) {
    console.error('AI Booking API Error:', error);
    res.status(500).json({
      error: 'Internal server error while generating AI booking suggestions',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Get AI booking history for a client
router.get('/history', [
  authenticateToken,
  requireRole(['client'])
], async (req, res) => {
  try {
    const clientId = req.user._id;

    // This could be expanded to track AI booking history
    // For now, return a placeholder response
    res.json({
      message: 'AI booking history retrieved',
      history: [],
      clientId: clientId.toString()
    });

  } catch (error) {
    console.error('AI Booking History Error:', error);
    res.status(500).json({
      error: 'Failed to retrieve AI booking history'
    });
  }
});

// Generate AI schedule based on user preferences
router.post('/generate-schedule', [
  authenticateToken,
  requireRole(['client']),
  body('workHours').isString().withMessage('Work hours are required'),
  body('workDays').isArray({ min: 1 }).withMessage('At least one work day must be selected'),
  body('availabilityNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workHours, workDays, availabilityNotes } = req.body;
    const clientId = req.user._id;

    console.log('AI Schedule Generation Request:', {
      clientId: clientId.toString(),
      workHours,
      workDays,
      availabilityNotes
    });

    // Generate AI schedule
    const result = await aiBookingService.generateClientSchedule(
      workHours,
      workDays,
      availabilityNotes
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate AI schedule',
        details: result.error
      });
    }

    res.json({
      message: 'AI schedule generated successfully',
      schedule: result.schedule,
      reasoning: result.reasoning,
      clientId: clientId.toString()
    });

  } catch (error) {
    console.error('AI Schedule Generation Error:', error);
    res.status(500).json({
      error: 'Internal server error while generating AI schedule',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Generate AI schedule for providers
router.post('/generate-provider-schedule', [
  authenticateToken,
  requireRole(['provider']),
  body('businessHours').isString().withMessage('Business hours are required'),
  body('businessDays').isArray({ min: 1 }).withMessage('At least one business day must be selected'),
  body('servicesNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { businessHours, businessDays, servicesNotes } = req.body;
    const providerId = req.user._id;

    console.log('AI Provider Schedule Generation Request:', {
      providerId: providerId.toString(),
      businessHours,
      businessDays,
      servicesNotes
    });

    // Generate AI schedule for provider
    const result = await aiBookingService.generateProviderSchedule(
      businessHours,
      businessDays,
      servicesNotes
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate AI provider schedule',
        details: result.error
      });
    }

    res.json({
      message: 'AI provider schedule generated successfully',
      schedule: result.schedule,
      reasoning: result.reasoning,
      providerId: providerId.toString()
    });

  } catch (error) {
    console.error('AI Provider Schedule Generation Error:', error);
    res.status(500).json({
      error: 'Internal server error while generating AI provider schedule',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Generate AI service for providers
router.post('/generate-service', [
  authenticateToken,
  requireRole(['provider']),
  body('serviceDetails').isString().withMessage('Service details are required'),
  body('servicePricing').isString().withMessage('Service pricing is required'),
  body('categories').isArray().withMessage('Categories are required'),
  body('providerSchedule').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { serviceDetails, servicePricing, categories, providerSchedule } = req.body;
    const providerId = req.user._id;

    console.log('AI Service Generation Request:', {
      providerId: providerId.toString(),
      serviceDetails,
      servicePricing,
      categoriesCount: categories.length,
      hasSchedule: !!providerSchedule
    });

    // Generate AI service
    const result = await aiBookingService.generateProviderService(
      serviceDetails,
      servicePricing,
      categories,
      providerSchedule
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate AI service',
        details: result.error
      });
    }

    res.json({
      message: 'AI service generated successfully',
      service: result.service,
      reasoning: result.reasoning,
      providerId: providerId.toString()
    });

  } catch (error) {
    console.error('AI Service Generation Error:', error);
    res.status(500).json({
      error: 'Internal server error while generating AI service',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

export default router;