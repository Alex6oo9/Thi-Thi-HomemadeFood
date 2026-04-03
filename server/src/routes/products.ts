import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { authenticateToken, requireRole } from '../middleware/auth';
import { RequestWithUser } from '../types';
import { body, param, query, validationResult } from 'express-validator';
import { validateAndSanitizeSearch } from '../utils/searchValidator';

const router = express.Router();

// Validation rules for product creation
const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Name must be 1-200 characters')
    .escape(),

  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('Description must be 1-2000 characters')
    .escape(),

  body('price')
    .isFloat({ min: 0.01, max: 10000000 }).withMessage('Price must be between 0.01 and 10,000,000')
    .toFloat(),

  body('imageUrl')
    .isURL().withMessage('Invalid image URL')
    .trim(),

  body('images')
    .optional()
    .isArray({ max: 5 }).withMessage('Maximum 5 images allowed'),

  body('images.*')
    .isURL({ require_protocol: true }).withMessage('Each image must be a valid URL'),

  body('ingredients')
    .optional()
    .isArray({ max: 30 }).withMessage('Maximum 30 ingredients allowed'),

  body('ingredients.*')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Each ingredient must be 1–100 characters')
    .escape(),

  body('isBestSeller')
    .optional()
    .isBoolean().withMessage('isBestSeller must be a boolean')
    .toBoolean(),
];

// Validation rules for product update
const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Name must be 1-200 characters')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('Description must be 1-2000 characters')
    .escape(),

  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 10000000 }).withMessage('Price must be between 0.01 and 10,000,000')
    .toFloat(),

  body('imageUrl')
    .optional()
    .isURL().withMessage('Invalid image URL')
    .trim(),

  body('available')
    .optional()
    .isBoolean().withMessage('Available must be a boolean')
    .toBoolean(),

  body('images')
    .optional()
    .isArray({ max: 5 }).withMessage('Maximum 5 images allowed'),

  body('images.*')
    .isURL({ require_protocol: true }).withMessage('Each image must be a valid URL'),

  body('ingredients')
    .optional()
    .isArray({ max: 30 }).withMessage('Maximum 30 ingredients allowed'),

  body('ingredients.*')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Each ingredient must be 1–100 characters')
    .escape(),

  body('isBestSeller')
    .optional()
    .isBoolean().withMessage('isBestSeller must be a boolean')
    .toBoolean(),
];

// Validation for MongoDB ObjectId params
const objectIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format')
];

// Get all products (public) with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const {
      available,
      isBestSeller,
      page: pageParam,
      limit: limitParam,
      sortBy,
      order,
      search
    } = req.query;

    // Parse and validate pagination parameters
    let page = parseInt(pageParam as string, 10);
    let limit = parseInt(limitParam as string, 10);

    // Handle invalid/missing values
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Enforce maximum limit

    // Validate and sanitize search query
    const searchQuery = search ? String(search) : undefined;
    if (searchQuery !== undefined && searchQuery.trim().length > 0) {
      const sanitizedSearch = validateAndSanitizeSearch(searchQuery);
      if (sanitizedSearch === null) {
        return res.status(400).json({
          error: 'Search query must be between 3 and 100 characters'
        });
      }
      // Store sanitized search for use in filter
      (req.query as any).sanitizedSearch = sanitizedSearch;
    }

    // Build filter
    const filter: any = {};
    if (available === 'true') {
      filter.available = true;
    }
    if (isBestSeller === 'true') {
      filter.isBestSeller = true;
    }

    // Add search filter if provided
    const sanitizedSearch = (req.query as any).sanitizedSearch;
    if (sanitizedSearch) {
      filter.name = { $regex: sanitizedSearch, $options: 'i' };
    }

    // Build sort
    const validSortFields = ['name', 'price', 'available', 'createdAt'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('createdBy', 'email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    // Return paginated response
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (public)
router.get('/:id', objectIdValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id).populate('createdBy', 'email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post('/', authenticateToken, requireRole('admin'), createProductValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, imageUrl, images, ingredients, isBestSeller } = req.body;

    // Enforce max 3 best sellers per seller when creating as best seller
    if (isBestSeller) {
      const bestSellerCount = await Product.countDocuments({
        createdBy: req.user!._id,
        isBestSeller: true,
      });
      if (bestSellerCount >= 3) {
        return res.status(400).json({ error: 'Maximum 3 best sellers allowed. Remove one first.' });
      }
    }

    const product = new Product({
      name,
      description,
      price,
      imageUrl,
      images: images ?? [],
      ingredients,
      isBestSeller: isBestSeller ?? false,
      createdBy: req.user!._id
    });

    await product.save();
    await product.populate('createdBy', 'email');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), [...objectIdValidation, ...updateProductValidation], async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, imageUrl, images, available, ingredients, isBestSeller } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Enforce max 3 best sellers when enabling via edit
    if (isBestSeller === true && !product.isBestSeller) {
      const bestSellerCount = await Product.countDocuments({
        createdBy: product.createdBy,
        isBestSeller: true,
      });
      if (bestSellerCount >= 3) {
        return res.status(400).json({ error: 'Maximum 3 best sellers allowed. Remove one first.' });
      }
    }

    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (images !== undefined) product.images = images;
    if (available !== undefined) product.available = available;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (isBestSeller !== undefined) product.isBestSeller = isBestSeller;

    await product.save();
    await product.populate('createdBy', 'email');

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), objectIdValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Toggle best seller status (admin only, max 3 limit)
router.patch('/:id/best-seller', authenticateToken, requireRole('admin'), objectIdValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If trying to set as best seller, check the limit
    if (!product.isBestSeller) {
      const bestSellerCount = await Product.countDocuments({
        createdBy: product.createdBy,
        isBestSeller: true
      });

      if (bestSellerCount >= 3) {
        return res.status(400).json({ error: 'Maximum 3 best sellers allowed. Remove one first.' });
      }
    }

    // Toggle best seller status
    product.isBestSeller = !product.isBestSeller;
    await product.save();
    await product.populate('createdBy', 'email');

    res.json({
      message: `Product ${product.isBestSeller ? 'added to' : 'removed from'} best sellers`,
      product
    });
  } catch (error) {
    console.error('Toggle best seller error:', error);
    res.status(500).json({ error: 'Failed to toggle best seller status' });
  }
});

export default router;