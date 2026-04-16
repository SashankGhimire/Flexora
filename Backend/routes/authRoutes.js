/**
 * Authentication Routes
 * Defines all auth-related API endpoints
 */

const express = require('express');
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
	createUserByAdmin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	if (!file.mimetype) {
		return cb(null, true);
	}

	if (file.mimetype.startsWith('image/')) {
		return cb(null, true);
	}
	return cb(new Error('Only image files are allowed'), false);
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 12 * 1024 * 1024 },
});

const handleAvatarUpload = (req, res, next) => {
	upload.single('avatar')(req, res, (error) => {
		if (!error) {
			return next();
		}

		if (error.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				message: 'Avatar file is too large. Please choose an image under 12MB.',
			});
		}

		return res.status(400).json({
			message: error.message || 'Invalid avatar upload',
		});
	});
};

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

// Create User By Admin
// POST /api/auth/admin/create-user
// body: { name, email, password }
router.post('/admin/create-user', createUserByAdmin);

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
router.put('/me', protect, handleAvatarUpload, updateMe);

module.exports = router;
