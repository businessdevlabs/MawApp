import express from 'express';
import ServiceCategory from '../models/ServiceCategory.js';

const router = express.Router();

// Get all service categories (main categories only, not subcategories)
router.get('/', async (req, res) => {
  try {
    const categories = await ServiceCategory.find({
      isActive: true,
      parentCategory: null // Only get main categories, not subcategories
    })
      .populate('subcategories', 'name description')
      .sort({ name: 1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID with common services
router.get('/:categoryId', async (req, res) => {
  try {
    const category = await ServiceCategory.findById(req.params.categoryId)
      .populate('subcategories', 'name description commonServices')
      .populate('parentCategory', 'name');
    
    if (!category || !category.isActive) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Get common services for a category
router.get('/:categoryId/services', async (req, res) => {
  try {
    const category = await ServiceCategory.findById(req.params.categoryId);

    if (!category || !category.isActive) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      categoryName: category.name,
      commonServices: category.commonServices || []
    });
  } catch (error) {
    console.error('Get common services error:', error);
    res.status(500).json({ error: 'Failed to fetch common services' });
  }
});

// Get subcategories for a category
router.get('/:categoryId/subcategories', async (req, res) => {
  try {
    console.log('Fetching subcategories for categoryId:', req.params.categoryId);
    const category = await ServiceCategory.findById(req.params.categoryId)
      .populate('subcategories', 'name isActive');

    console.log('Found category:', category ? { _id: category._id, name: category.name, isActive: category.isActive, subcategories: category.subcategories } : null);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!category.isActive) {
      return res.status(404).json({ error: 'Category is not active' });
    }

    // Extract subcategory names from the populated data
    const subcategories = category.subcategories
      .filter(subcat => subcat.isActive !== false) // Only include active subcategories
      .map(subcat => subcat.name);

    console.log('Returning subcategories:', subcategories);
    res.json({ subcategories });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

export default router;