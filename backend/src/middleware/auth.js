const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if it's a refresh token (not allowed for API access)
        if (decoded.type === 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }
        
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }
        
        // Add user info to request
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id;
                req.userRole = user.role;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};

// Admin only middleware
const adminOnly = authorize('admin');

// Manager and above middleware
const managerOrAbove = authorize('admin', 'manager');

// Staff and above middleware (excludes customers)
const staffOrAbove = authorize('admin', 'manager', 'staff');

// Check if user owns resource or has elevated permissions
const ownerOrElevated = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        // Admins and managers can access any resource
        if (['admin', 'manager'].includes(req.userRole)) {
            return next();
        }
        
        // Check if user owns the resource
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (resourceUserId && resourceUserId.toString() === req.userId.toString()) {
            return next();
        }
        
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    };
};

// Verify refresh token
const verifyRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }
        
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }
        
        // Check if refresh token exists in user's tokens
        const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
        
        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        
        req.user = user;
        req.refreshToken = refreshToken;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired'
            });
        }
        
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

// Rate limiting for sensitive operations
const createRateLimit = (windowMs, max, message) => {
    const rateLimit = require('express-rate-limit');
    
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting for admins
            return req.userRole === 'admin';
        }
    });
};

// Specific rate limits
const loginRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many login attempts, please try again later'
);

const registerRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // 3 registrations
    'Too many registration attempts, please try again later'
);

const passwordResetRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts
    'Too many password reset attempts, please try again later'
);

module.exports = {
    generateToken,
    generateRefreshToken,
    authenticateToken,
    optionalAuth,
    authorize,
    adminOnly,
    managerOrAbove,
    staffOrAbove,
    ownerOrElevated,
    verifyRefreshToken,
    loginRateLimit,
    registerRateLimit,
    passwordResetRateLimit
}; 