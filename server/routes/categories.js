import express from 'express';
import ServiceCategory from '../models/ServiceCategory.js';

const router = express.Router();

// Get all service categories
router.get('/', async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true })
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

export default router;