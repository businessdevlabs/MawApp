import express from 'express';
import ServiceCategory from '../models/ServiceCategory.js';

const router = express.Router();

// Get subcategories for a category by ID - Simplified API
router.get('/:categoryId', async (req, res) => {
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