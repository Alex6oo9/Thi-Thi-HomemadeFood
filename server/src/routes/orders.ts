import express, { Response } from 'express';
import { Readable } from 'stream';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { RequestWithUser } from '../types';
import { calculateOrderTotals } from '../utils/calcTotals';
import { config } from '../config/env';
import { body, param, validationResult } from 'express-validator';
import { fileTypeFromBuffer } from 'file-type';
import { uploadLimiter, orderLimiter } from '../middleware/rateLimiter';
import { validateAndSanitizeSearch } from '../utils/searchValidator';
import cloudinary from '../config/cloudinary';

const bufferToStream = (buffer: Buffer): Readable => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

const router = express.Router();

// Validate image file using magic bytes
const validateImageFile = async (buffer: Buffer): Promise<void> => {
  const type = await fileTypeFromBuffer(buffer);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!type || !allowedTypes.includes(type.mime)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }
};

// Validation rules for order creation
const createOrderValidation = [
  body('items')
    .isArray({ min: 1, max: 50 }).withMessage('Items must be a non-empty array (max 50 distinct items),'),

  body('items.*.productId')
    .isMongoId().withMessage('Invalid product ID'),

  body('items.*.qty')
    .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
    .escape(),

  body('contactInfo.name')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters')
    .escape(),

  body('contactInfo.phone')
    .trim()
    .matches(/^[0-9]{7,15}$/).withMessage('Invalid phone number format'),

  body('contactInfo.address')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Address must be 5-500 characters')
    .escape()
];

// Validation for order status update
const updateStatusValidation = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),

  body('status')
    .isIn(['RECEIVED', 'PREPARING', 'DELIVERED']).withMessage('Invalid status')
];

// Validation for payment proof upload
const paymentProofValidation = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),

  body('txLast6')
    .isLength({ min: 6, max: 6 }).withMessage('Transaction ID last 6 digits must be exactly 6 characters')
    .matches(/^[0-9]{6}$/).withMessage('Transaction ID must contain only digits')
];

// Validation for payment verification
const verifyPaymentValidation = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),

  body('verified')
    .isBoolean().withMessage('Verified must be a boolean')
    .toBoolean()
];

// Validation for ObjectId params
const objectIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid order ID')
];

// Create order
router.post('/', authenticateToken, orderLimiter, createOrderValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, notes, contactInfo } = req.body;

    // Validate and populate items
    const orderItems = [];
    for (const item of items) {

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }

      if (!product.available) {
        return res.status(400).json({ error: `Product not available: ${product.name}` });
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        qty: item.qty
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(orderItems);

    // Create order
    const order = new Order({
      userId: req.user!._id,
      items: orderItems,
      notes: notes || '',
      contactInfo,
      totals,
      status: 'RECEIVED',
      payment: {
        method: 'KBZPAY',
        verified: false
      }
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get my orders (customer) with pagination and sorting
router.get('/my', authenticateToken, async (req: RequestWithUser, res) => {
  try {
    const {
      status,
      page: pageParam,
      limit: limitParam,
      sortBy,
      order
    } = req.query;

    // Parse and validate pagination parameters
    let page = parseInt(pageParam as string, 10);
    let limit = parseInt(limitParam as string, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    // Build filter - only user's own orders
    const filter: any = { userId: req.user!._id };

    if (status && ['RECEIVED', 'PREPARING', 'DELIVERED'].includes(status as string)) {
      filter.status = status;
    }

    // Build sort
    const validSortFields = ['status', 'createdAt', 'total'];
    let sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    // Handle sorting by total (nested field)
    const sort: any = sortField === 'total'
      ? { 'totals.total': sortOrder }
      : { [sortField]: sortOrder };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get all orders (admin only) with pagination and sorting
router.get('/', authenticateToken, requireRole('admin'), async (req: RequestWithUser, res) => {
  try {
    const {
      status,
      page: pageParam,
      limit: limitParam,
      sortBy,
      order,
      search
    } = req.query;

    // Parse and validate pagination parameters
    let page = parseInt(pageParam as string, 10);
    let limit = parseInt(limitParam as string, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

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

    if (status && ['RECEIVED', 'PREPARING', 'DELIVERED'].includes(status as string)) {
      filter.status = status;
    }

    // Add search filter if provided (search by order ID or phone number)
    const sanitizedSearch = (req.query as any).sanitizedSearch;
    if (sanitizedSearch) {
      filter.$or = [
        { _id: { $regex: sanitizedSearch, $options: 'i' } },
        { 'contactInfo.phone': { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    // Build sort
    const validSortFields = ['status', 'createdAt', 'total'];
    let sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    // Handle sorting by total (nested field)
    const sort: any = sortField === 'total'
      ? { 'totals.total': sortOrder }
      : { [sortField]: sortOrder };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, objectIdValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id).populate('userId', 'email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check access - customers can only view their own orders
    if (req.user!.role === 'customer' && order.userId._id.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authenticateToken, requireRole('admin'), updateStatusValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Upload payment proof
router.post('/:id/payment', authenticateToken, uploadLimiter, uploadImage, paymentProofValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { txLast6 } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof image is required' });
    }

    // Validate actual file content using magic bytes
    try {
      await validateImageFile(req.file.buffer);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check ownership - customers can only update their own orders
    if (req.user!.role === 'customer' && order.userId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Upload proof to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'ecommerce/payment_proofs', resource_type: 'image' },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      bufferToStream(req.file!.buffer).pipe(stream);
    });

    order.payment.proofUrl = uploadResult.secure_url;
    order.payment.txLast6 = txLast6;
    order.payment.verified = false;
    order.payment.rejected = false; // Clear rejection when new proof is uploaded

    await order.save();

    res.json({
      message: 'Payment proof uploaded successfully',
      order
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// Verify payment (admin only)
router.patch('/:id/verify', authenticateToken, requireRole('admin'), verifyPaymentValidation, async (req: RequestWithUser, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { verified } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.payment.verified = verified;
    order.payment.rejected = !verified;
    await order.save();

    res.json({
      message: `Payment ${verified ? 'verified' : 'rejected'} successfully`,
      order
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;