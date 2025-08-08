import express from 'express';
import Service from '../models/Service.js';
import ServiceProvider from '../models/ServiceProvider.js';
import ServiceCategory from '../models/ServiceCategory.js';

const router = express.Router();

// Get all public services (for client browsing)
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, location, page = 1, limit = 20 } = req.query;
    
    // Build query filters
    const query = { isActive: { $ne: false } }; // Only active services
    
    // Search filter (name or description)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get services with populated data
    const services = await Service.find(query)
      .populate('category', 'name description icon')
      .populate({
        path: 'providerId',
        select: 'businessName businessAddress businessPhone businessEmail averageRating totalReviews status',
        match: { status: { $in: ['approved', 'pending'] } } // Show approved and pending providers
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Filter out services where provider is null (not approved)
    const filteredServices = services.filter(service => service.providerId !== null);
    
    // Get total count for pagination
    const totalCount = await Service.countDocuments({
      ...query,
      providerId: { $in: await ServiceProvider.find({ status: { $in: ['approved', 'pending'] } }).distinct('_id') }
    });
    
    res.json({
      services: filteredServices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID (for service detail page)
router.get('/:serviceId', async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId)
      .populate('category', 'name description icon')
      .populate({
        path: 'providerId',
        select: 'businessName businessDescription businessAddress businessPhone businessEmail businessHours averageRating totalReviews status',
        match: { status: { $in: ['approved', 'pending'] } }
      });
    
    if (!service || service.isActive === false) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (!service.providerId) {
      return res.status(404).json({ error: 'Service provider not available' });
    }
    
    res.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Get services by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { 
      category: req.params.categoryId,
      isActive: { $ne: false }
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const services = await Service.find(query)
      .populate('category', 'name description icon')
      .populate({
        path: 'providerId',
        select: 'businessName businessAddress businessPhone businessEmail averageRating totalReviews status',
        match: { status: { $in: ['approved', 'pending'] } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const filteredServices = services.filter(service => service.providerId !== null);
    
    const totalCount = await Service.countDocuments({
      ...query,
      providerId: { $in: await ServiceProvider.find({ status: { $in: ['approved', 'pending'] } }).distinct('_id') }
    });
    
    res.json({
      services: filteredServices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

export default router;