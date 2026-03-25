/**
 * Authentication Routes
 * Defines all auth-related API endpoints
 */

const express = require('express');
const path = require('path');
const multer = require('multer');
const {
	register,
	login,
	getMe,
	updateMe,
	listUsers,
	getUserById,
	updateUserById,
	deleteUserById,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, avatarsDir);
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
		const safeId = req.user?.id || 'guest';
		cb(null, `avatar-${safeId}-${Date.now()}${ext}`);
	},
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype && file.mimetype.startsWith('image/')) {
		return cb(null, true);
	}
	return cb(new Error('Only image files are allowed'), false);
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Public Routes
 */

// User Registration
// POST /api/auth/register
// body: { name, email, password }
router.post('/register', register);

// User Login
// POST /api/auth/login
// body: { email, password }
router.post('/login', login);

// Get Users List (admin dashboard data)
// GET /api/auth/users
router.get('/users', listUsers);

// Get User Details (admin dashboard)
// GET /api/auth/users/:id
router.get('/users/:id', getUserById);

// Update User (admin dashboard)
// PUT /api/auth/users/:id
router.put('/users/:id', updateUserById);

// Delete User (admin dashboard)
// DELETE /api/auth/users/:id
router.delete('/users/:id', deleteUserById);

/**
 * Protected Routes (require valid JWT token)
 */

// Get Current User
// GET /api/auth/me
// headers: { Authorization: 'Bearer <token>' }
router.get('/me', protect, getMe);

// Update Current User (name/avatar)
// PUT /api/auth/me
// headers: { Authorization: 'Bearer <token>' }
// form-data: { name?, avatar? }
router.put('/me', protect, upload.single('avatar'), updateMe);

module.exports = router;
