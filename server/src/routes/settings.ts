import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { BusinessSettings } from '../models/BusinessSettings';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

const DEFAULTS = {
  phoneNumber: '',
  viberNumber: '',
  contactEmail: '',
  fbPageUrl: '',
  fbPageName: '',
  kbzPayNumber: '',
  kbzPayName: '',
  bankName: '',
};

// GET /api/settings/business — public
router.get('/business', async (_req, res, next) => {
  try {
    const settings = await BusinessSettings.findOne();
    res.json(settings ?? DEFAULTS);
  } catch (err) {
    next(err);
  }
});

// Myanmar phone: 09xxxxxxxx | 01xxxxxxx | +959xxxxxxxx | +9501xxxxxxx (empty string allowed to clear)
const myanmarPhone = /^(\+?950?|0)[0-9]{6,12}$/;

// PUT /api/settings/business — admin only
const updateValidation = [
  body('phoneNumber')
    .optional().trim().customSanitizer(val => val.replace(/[\s\-]/g, ''))
    .isLength({ max: 30 }).withMessage('Phone too long')
    .custom(val => !val || myanmarPhone.test(val))
    .withMessage('Invalid Myanmar phone number (e.g. 09xxxxxxxx or +9509xxxxxxxx)'),
  body('viberNumber')
    .optional().trim().customSanitizer(val => val.replace(/[\s\-]/g, ''))
    .isLength({ max: 30 }).withMessage('Viber number too long')
    .custom(val => !val || myanmarPhone.test(val))
    .withMessage('Invalid Myanmar phone number (e.g. 09xxxxxxxx or +9509xxxxxxxx)'),
  body('contactEmail').optional().trim().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('fbPageUrl').optional().trim().isURL({ require_protocol: true }).withMessage('Invalid Facebook URL'),
  body('fbPageName').optional().trim().isLength({ max: 100 }).withMessage('Page name too long').escape(),
  body('kbzPayNumber')
    .optional().trim().customSanitizer(val => val.replace(/[\s\-]/g, ''))
    .isLength({ max: 30 }).withMessage('KBZPay number too long')
    .custom(val => !val || myanmarPhone.test(val))
    .withMessage('Invalid KBZPay number (must be a valid Myanmar phone number)'),
  body('kbzPayName').optional().trim().isLength({ max: 100 }).withMessage('KBZPay name too long').escape(),
  body('bankName').optional().trim().isLength({ max: 100 }).withMessage('Bank name too long').escape(),
];

router.put(
  '/business',
  authenticateToken,
  requireRole('admin'),
  updateValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const allowed = [
        'phoneNumber', 'viberNumber', 'contactEmail',
        'fbPageUrl', 'fbPageName',
        'kbzPayNumber', 'kbzPayName',
        'bankName',
      ];

      const updates: Record<string, string> = {};
      for (const key of allowed) {
        if (key in req.body) {
          updates[key] = req.body[key];
        }
      }

      const settings = await BusinessSettings.findOneAndUpdate(
        {},
        { $set: updates },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.json(settings);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
