/**
 * @file routes/index.js
 * @description Central router — mounts all API routes with validation.
 */

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { authenticate, optionalAuth, isAdmin, isEditor } = require('../middleware/auth');

const authCtrl     = require('../controllers/authController');
const couponCtrl   = require('../controllers/couponController');
const storeCtrl    = require('../controllers/storeController');
const cashbackCtrl = require('../controllers/cashbackController');
const userCtrl     = require('../controllers/userController');
const alertCtrl    = require('../controllers/alertController');
const adminCtrl    = require('../controllers/adminController');

// ── Rate limiters ─────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Auth validators ───────────────────────────────────────────────────────────

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2–120 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain upper, lower and digit'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// ── Auth routes ───────────────────────────────────────────────────────────────

router.post('/auth/register', authLimiter, registerValidation, authCtrl.register);
router.post('/auth/login',    authLimiter, loginValidation,    authCtrl.login);
router.post('/auth/refresh',  authCtrl.refresh);
router.post('/auth/forgot-password', authLimiter,
  body('email').isEmail(), authCtrl.forgotPassword);
router.post('/auth/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }), authCtrl.resetPassword);
router.get('/auth/verify-email/:token', authCtrl.verifyEmail);
router.get('/auth/me', authenticate, authCtrl.getMe);

// ── Coupon routes ─────────────────────────────────────────────────────────────

router.get('/coupons',          optionalAuth, couponCtrl.listCoupons);
router.get('/coupons/featured', couponCtrl.getFeatured);
router.get('/coupons/:id',      optionalAuth, couponCtrl.getCoupon);

// Use / vote (auth optional for tracking, auth required for vote)
router.post('/coupons/:id/use',  optionalAuth, couponCtrl.trackUse);
router.post('/coupons/:id/vote', authenticate,
  body('vote').isIn([1, -1]), couponCtrl.voteCoupon);

// Admin/editor only
router.post('/coupons',   authenticate, isEditor, [
  body('store_id').isUUID(),
  body('title').trim().isLength({ min: 5 }),
  body('type').isIn(['coupon','deal','cashback','frete_gratis']),
], couponCtrl.createCoupon);
router.patch('/coupons/:id',  authenticate, isEditor, couponCtrl.updateCoupon);
router.delete('/coupons/:id', authenticate, isAdmin,  couponCtrl.deleteCoupon);

// ── Store routes ──────────────────────────────────────────────────────────────

router.get('/stores',          storeCtrl.listStores);
router.get('/stores/:slug',    storeCtrl.getStore);
router.post('/stores',   authenticate, isAdmin, [
  body('name').trim().isLength({ min: 2 }),
  body('slug').trim().isLength({ min: 2 }),
  body('website_url').isURL(),
], storeCtrl.createStore);
router.patch('/stores/:id', authenticate, isAdmin, storeCtrl.updateStore);

// ── Cashback routes ───────────────────────────────────────────────────────────

router.get('/cashback/balance',      authenticate, cashbackCtrl.getBalance);
router.get('/cashback/transactions', authenticate, cashbackCtrl.listTransactions);
router.get('/cashback/withdrawals',  authenticate, cashbackCtrl.listWithdrawals);
router.post('/cashback/withdraw',    authenticate, [
  body('amount').isFloat({ min: 20 }),
  body('pix_key').notEmpty(),
], cashbackCtrl.requestWithdrawal);
router.post('/cashback/admin/confirm/:transactionId',
  authenticate, isAdmin, cashbackCtrl.confirmTransaction);

// ── User / profile routes ─────────────────────────────────────────────────────

router.get('/users/profile',           authenticate, userCtrl.getProfile);
router.patch('/users/profile',         authenticate, userCtrl.updateProfile);
router.post('/users/change-password',  authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], userCtrl.changePassword);
router.get('/users/favorites',         authenticate, userCtrl.getFavorites);
router.post('/users/favorites/:couponId',    authenticate, userCtrl.addFavorite);
router.delete('/users/favorites/:couponId',  authenticate, userCtrl.removeFavorite);
router.get('/users/notifications',     authenticate, userCtrl.getNotifications);
router.patch('/users/notifications/:id/read', authenticate, userCtrl.markNotificationRead);

// ── Price alerts ──────────────────────────────────────────────────────────────

router.get('/alerts',         authenticate, alertCtrl.listAlerts);
router.post('/alerts',        authenticate, [
  body('product_url').isURL(),
  body('target_price').isFloat({ min: 0.01 }),
], alertCtrl.createAlert);
router.patch('/alerts/:id',   authenticate, alertCtrl.updateAlert);
router.delete('/alerts/:id',  authenticate, alertCtrl.deleteAlert);

// ── Admin routes ──────────────────────────────────────────────────────────────

router.get('/admin/dashboard',  authenticate, isAdmin, adminCtrl.getDashboard);
router.get('/admin/users',      authenticate, isAdmin, adminCtrl.listUsers);
router.patch('/admin/users/:id', authenticate, isAdmin, adminCtrl.updateUser);
router.get('/admin/withdrawals', authenticate, isAdmin, adminCtrl.listWithdrawals);
router.patch('/admin/withdrawals/:id', authenticate, isAdmin, adminCtrl.processWithdrawal);
router.post('/admin/sync-coupons', authenticate, isAdmin, adminCtrl.triggerSync);

// ── Categories ────────────────────────────────────────────────────────────────

router.get('/categories', async (req, res, next) => {
  try {
    const { query: dbQuery } = require('../config/database');
    const result = await dbQuery(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order, name'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// ── Search (unified) ──────────────────────────────────────────────────────────

router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: { coupons: [], stores: [] } });

    const { query: dbQuery } = require('../config/database');
    const [coupons, stores] = await Promise.all([
      dbQuery(
        `SELECT c.id, c.title, c.code, c.type, c.discount_value, c.discount_type,
                s.name AS store_name, s.slug AS store_slug, s.logo_url
         FROM coupons c JOIN stores s ON s.id = c.store_id
         WHERE c.is_active = TRUE
           AND to_tsvector('portuguese', c.title || ' ' || COALESCE(c.description,''))
               @@ plainto_tsquery('portuguese', $1)
         ORDER BY c.uses_count DESC LIMIT $2`,
        [q, Math.min(parseInt(limit), 20)]
      ),
      dbQuery(
        `SELECT id, name, slug, logo_url, total_coupons
         FROM stores WHERE is_active = TRUE AND name ILIKE $1 LIMIT 5`,
        [`%${q}%`]
      ),
    ]);

    res.json({ success: true, data: { coupons: coupons.rows, stores: stores.rows } });
  } catch (err) { next(err); }
});

module.exports = router;
