import express from 'express';
import ServiceProvider from '../models/ServiceProvider.js';
import Service from '../models/Service.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all providers (authenticated endpoint for browsing)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minRating, 
      maxRating,
      location,
      sortBy = 'rating',
      sortOrder = 'desc',
      hasWebsite,
      hasPhone,
      limit = 50, 
      page = 1 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
        { businessAddress: { $regex: search, $options: 'i' } }
      ];
    }

    // Rating filter - simplified approach
    if (minRating || maxRating) {
      const minRatingValue = minRating ? parseFloat(minRating) : 0;
      const maxRatingValue = maxRating ? parseFloat(maxRating) : 5;
      
      // Rating filters will be applied in the aggregation pipeline
    }

    // Location filter (if searching for specific city/area)
    if (location) {
      query.businessAddress = { $regex: location, $options: 'i' };
    }

    // Website filter
    if (hasWebsite === 'true') {
      query.website = { $ne: null, $ne: '' };
    } else if (hasWebsite === 'false') {
      query.$or = [
        { website: null },
        { website: '' }
      ];
    }

    // Phone filter
    if (hasPhone === 'true') {
      query.businessPhone = { $ne: null, $ne: '' };
    } else if (hasPhone === 'false') {
      query.$or = [
        { businessPhone: null },
        { businessPhone: '' }
      ];
    }

    // Build sort object
    let sortObject = {};
    const order = sortOrder === 'desc' ? -1 : 1;
    
    switch (sortBy) {
      case 'rating':
        sortObject = { averageRating: order, totalReviews: -1, createdAt: -1 };
        break;
      case 'reviews':
        sortObject = { totalReviews: order, averageRating: -1, createdAt: -1 };
        break;
      case 'name':
        sortObject = { businessName: order };
        break;
      case 'newest':
        sortObject = { createdAt: -1 };
        break;
      case 'oldest':
        sortObject = { createdAt: 1 };
        break;
      default:
        sortObject = { averageRating: -1, totalReviews: -1, createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build aggregation pipeline to handle rating filtering properly
    const pipeline = [
      // Match the basic query first
      { $match: query },
      
      // Add computed field for effective rating (use 4.8 if null/undefined/0)
      {
        $addFields: {
          effectiveRating: {
            $cond: {
              if: { $or: [
                { $eq: ['$averageRating', null] },
                { $eq: ['$averageRating', 0] },
                { $not: { $ifNull: ['$averageRating', false] } }
              ]},
              then: 4.8,
              else: '$averageRating'
            }
          }
        }
      },
      
      // Apply rating filters on computed field
      ...(minRating || maxRating ? [{
        $match: {
          effectiveRating: {
            ...(minRating ? { $gte: parseFloat(minRating) } : {}),
            ...(maxRating ? { $lte: parseFloat(maxRating) } : {})
          }
        }
      }] : []),
      
      // Populate references
      {
        $lookup: {
          from: 'servicecategories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, description: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'services',
          foreignField: '_id',
          as: 'services'
        }
      },
      
      // Unwind category (since it's a single reference)
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Add service count
      {
        $addFields: {
          serviceCount: { $size: { $ifNull: ['$services', []] } }
        }
      },
      
      // Project final fields
      {
        $project: {
          businessName: 1,
          businessDescription: 1,
          businessAddress: 1,
          businessPhone: 1,
          businessEmail: 1,
          website: 1,
          category: 1,
          services: 1,
          serviceCount: 1,
          averageRating: {
            $cond: {
              if: { $or: [
                { $eq: ['$averageRating', null] },
                { $eq: ['$averageRating', 0] },
                { $not: { $ifNull: ['$averageRating', false] } }
              ]},
              then: 4.8,
              else: '$averageRating'
            }
          },
          totalReviews: { $ifNull: ['$totalReviews', 0] },
          coordinates: 1,
          createdAt: 1
        }
      },
      
      // Sort
      { $sort: sortObject },
      
      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    // Execute aggregation
    const providers = await ServiceProvider.aggregate(pipeline);

    // Get total count for pagination (using same base query + rating filters)
    const countPipeline = [
      { $match: query },
      {
        $addFields: {
          effectiveRating: {
            $cond: {
              if: { $or: [
                { $eq: ['$averageRating', null] },
                { $eq: ['$averageRating', 0] },
                { $not: { $ifNull: ['$averageRating', false] } }
              ]},
              then: 4.8,
              else: '$averageRating'
            }
          }
        }
      },
      ...(minRating || maxRating ? [{
        $match: {
          effectiveRating: {
            ...(minRating ? { $gte: parseFloat(minRating) } : {}),
            ...(maxRating ? { $lte: parseFloat(maxRating) } : {})
          }
        }
      }] : []),
      { $count: 'totalProviders' }
    ];

    const totalResult = await ServiceProvider.aggregate(countPipeline);
    const totalProviders = totalResult[0]?.totalProviders || 0;

    // Providers are already transformed by the aggregation pipeline
    const transformedProviders = providers.map(provider => ({
      _id: provider._id,
      businessName: provider.businessName,
      businessDescription: provider.businessDescription,
      businessAddress: provider.businessAddress,
      businessPhone: provider.businessPhone,
      businessEmail: provider.businessEmail,
      website: provider.website,
      category: provider.category?.name,
      serviceCount: provider.serviceCount,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
      coordinates: provider.coordinates,
      createdAt: provider.createdAt
    }));

    res.json({
      providers: transformedProviders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProviders / parseInt(limit)),
        totalProviders,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get single provider details by ID
router.get('/:providerId', authenticateToken, async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.providerId)
      .populate('category', 'name description')
      .populate('services');

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Get provider's services with category details
    const services = await Service.find({ providerId: provider._id })
      .populate('category', 'name description')
      .select('name description price duration category isActive');

    const providerDetails = {
      _id: provider._id,
      businessName: provider.businessName,
      businessDescription: provider.businessDescription,
      businessAddress: provider.businessAddress,
      businessPhone: provider.businessPhone,
      businessEmail: provider.businessEmail,
      website: provider.website,
      category: provider.category,
      services: services,
      averageRating: provider.averageRating || 4.8,
      totalReviews: provider.totalReviews || 0,
      coordinates: provider.coordinates,
      businessHours: provider.businessHours,
      createdAt: provider.createdAt
    };

    res.json({ provider: providerDetails });

  } catch (error) {
    console.error('Get provider details error:', error);
    res.status(500).json({ error: 'Failed to fetch provider details' });
  }
});

export default router;