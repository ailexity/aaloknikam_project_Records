const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const {
    generateToken,
    generateRefreshToken,
    authenticateToken,
    verifyRefreshToken,
    adminOnly,
    managerOrAbove,
    loginRateLimit,
    registerRateLimit,
    passwordResetRateLimit
} = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name is required and must be less than 50 characters'),
    body('role')
        .optional()
        .isIn(['admin', 'manager', 'staff'])
        .withMessage('Invalid role')
];

const loginValidation = [
    body('emailOrUsername')
        .notEmpty()
        .withMessage('Email or username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (with rate limiting)
router.post('/register', registerRateLimit, registerValidation, handleValidationErrors, async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Create new user
        const userData = {
            username,
            email,
            password,
            firstName,
            lastName
        };

        // Only allow role assignment by admins or for first user (auto-admin)
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            userData.role = 'admin'; // First user becomes admin
        } else if (role && req.userRole === 'admin') {
            userData.role = role;
        }

        const user = new User(userData);
        await user.save();

        // Generate tokens
        const accessToken = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshTokens.push({ token: refreshToken });
        await user.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public (with rate limiting)
router.post('/login', loginRateLimit, loginValidation, handleValidationErrors, async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        // Find user and validate credentials
        const user = await User.findByCredentials(emailOrUsername, password);

        // Generate tokens
        const accessToken = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshTokens.push({ token: refreshToken });
        await user.save();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', verifyRefreshToken, async (req, res) => {
    try {
        const { user, refreshToken } = req;

        // Generate new access token
        const accessToken = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken,
                user
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const user = req.user;

        if (refreshToken) {
            // Remove specific refresh token
            user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
        } else {
            // Remove all refresh tokens (logout from all devices)
            user.refreshTokens = [];
        }

        await user.save();

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile'
        });
    }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', authenticateToken, [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('username').optional().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/)
], handleValidationErrors, async (req, res) => {
    try {
        const { firstName, lastName, email, username } = req.body;
        const user = req.user;

        // Check if email or username already exists (excluding current user)
        if (email || username) {
            const query = {
                _id: { $ne: user._id }
            };
            
            if (email && username) {
                query.$or = [{ email }, { username }];
            } else if (email) {
                query.email = email;
            } else if (username) {
                query.username = username;
            }

            const existingUser = await User.findOne(query);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: existingUser.email === email ? 'Email already in use' : 'Username already taken'
                });
            }
        }

        // Update user fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (username) user.username = username;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, changePasswordValidation, handleValidationErrors, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId).select('+password');

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Invalidate all refresh tokens (force re-login on all devices)
        user.refreshTokens = [];
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (admin/manager only)
// @access  Private (Manager+)
router.get('/users', authenticateToken, managerOrAbove, async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        
        const query = {};
        
        // Filter by role
        if (role) {
            query.role = role;
        }
        
        // Search by name, username, or email
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-refreshTokens')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
});

// @route   PUT /api/auth/users/:id/role
// @desc    Update user role (admin only)
// @access  Private (Admin only)
router.put('/users/:id/role', authenticateToken, adminOnly, [
    body('role').isIn(['admin', 'manager', 'staff', 'customer']).withMessage('Invalid role')
], handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent changing own role
        if (user._id.toString() === req.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own role'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: {
                user
            }
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role'
        });
    }
});

// @route   PUT /api/auth/users/:id/status
// @desc    Activate/deactivate user (admin only)
// @access  Private (Admin only)
router.put('/users/:id/status', authenticateToken, adminOnly, [
    body('isActive').isBoolean().withMessage('isActive must be a boolean')
], handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating own account
        if (user._id.toString() === req.userId.toString() && !isActive) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account'
            });
        }

        user.isActive = isActive;
        
        // If deactivating, remove all refresh tokens
        if (!isActive) {
            user.refreshTokens = [];
        }
        
        await user.save();

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                user
            }
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

module.exports = router; 