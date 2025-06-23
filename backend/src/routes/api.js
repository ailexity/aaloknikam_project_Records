const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const { 
    authenticateToken, 
    optionalAuth,
    staffOrAbove, 
    managerOrAbove, 
    adminOnly 
} = require('../middleware/auth');

// Menu Routes

// Get all menu items (public access)
router.get('/menu', optionalAuth, async (req, res) => {
    try {
        const menuItems = await Menu.find();
        
        res.json({
            success: true,
            data: menuItems,
            count: menuItems.length
        });
    } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch menu items',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Add new menu item (staff and above)
router.post('/menu', authenticateToken, staffOrAbove, async (req, res) => {
    try {
        const { name, price, itemId, category, available, description } = req.body;

        // Check if itemId already exists
        const existingItem = await Menu.findOne({ itemId });
        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Item ID already exists'
            });
        }

        const menuItem = new Menu({
            name,
            price,
            itemId,
            category,
            description,
            isAvailable: available !== undefined ? available : true,
            createdBy: req.userId
        });

        const newMenuItem = await menuItem.save();
        
        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: newMenuItem
        });
    } catch (err) {
        console.error('Error creating menu item:', err);
        res.status(400).json({ 
            success: false,
            message: 'Failed to create menu item',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Update menu item (staff and above)
router.put('/menu/:id', optionalAuth, async (req, res) => {
    try {
        const { name, price, itemId, category, available, description } = req.body;
        
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ 
                success: false,
                message: 'Menu item not found' 
            });
        }

        // Check if itemId already exists (excluding current item)
        if (itemId && itemId !== menuItem.itemId) {
            const existingItem = await Menu.findOne({ 
                itemId, 
                _id: { $ne: req.params.id } 
            });
            if (existingItem) {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID already exists'
                });
            }
        }

        // Update fields
        if (name) menuItem.name = name;
        if (price) menuItem.price = price;
        if (itemId) menuItem.itemId = itemId;
        if (category) menuItem.category = category;
        if (description) menuItem.description = description;
        if (available !== undefined) menuItem.isAvailable = available;
        
        if (req.userId) menuItem.updatedBy = req.userId;

        const updatedMenuItem = await menuItem.save();
        
        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: updatedMenuItem
        });
    } catch (err) {
        console.error('Error updating menu item:', err);
        res.status(400).json({ 
            success: false,
            message: 'Failed to update menu item',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Delete menu item (manager and above)
router.delete('/menu/:id', authenticateToken, managerOrAbove, async (req, res) => {
    try {
        const result = await Menu.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ 
                success: false,
                message: 'Menu item not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Menu item deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting menu item:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete menu item',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Order Routes

// Get all orders (staff and above)
router.get('/orders', optionalAuth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        
        // If user is authenticated and is staff, only show their orders
        if (req.userId && req.userRole === 'staff') {
            query.createdBy = req.userId;
        }

        const orders = await Order.find(query)
            .populate('items.menuItem')
            .populate('createdBy', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch orders',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Create new order (authenticated users)
router.post('/orders', optionalAuth, async (req, res) => {
    try {
        const { tableNumber, customerName, items, totalAmount, status } = req.body;

        // Validate menu items exist and calculate total
        let calculatedTotal = 0;
        for (const item of items) {
            const menuItem = await Menu.findById(item.menuItem);
            if (!menuItem) {
                return res.status(400).json({
                    success: false,
                    message: `Menu item not found: ${item.menuItem}`
                });
            }
            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Menu item not available: ${menuItem.name}`
                });
            }
            calculatedTotal += menuItem.price * item.quantity;
        }

        const order = new Order({
            tableNumber,
            customerName,
            items,
            totalAmount: calculatedTotal,
            status: status || 'pending',
            createdBy: req.userId || null
        });

        const newOrder = await order.save();
        const populatedOrder = await Order.findById(newOrder._id)
            .populate('items.menuItem')
            .populate('createdBy', 'firstName lastName username');
            
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: populatedOrder
        });
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(400).json({ 
            success: false,
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Update order status (staff and above)
router.put('/orders/:id', optionalAuth, async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        // Staff can only update orders they created, unless manager+
        if (req.userId && req.userRole === 'staff' && order.createdBy && order.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        order.updatedBy = req.userId || null;

        const updatedOrder = await order.save();
        const populatedOrder = await Order.findById(updatedOrder._id)
            .populate('items.menuItem')
            .populate('createdBy', 'firstName lastName username')
            .populate('updatedBy', 'firstName lastName username');
            
        res.json({
            success: true,
            message: 'Order updated successfully',
            data: populatedOrder
        });
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(400).json({ 
            success: false,
            message: 'Failed to update order',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Delete order (manager and above)
router.delete('/orders/:id', authenticateToken, managerOrAbove, async (req, res) => {
    try {
        const result = await Order.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Order deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete order',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Feedback Routes

// Get all feedback (staff and above)
router.get('/feedback', authenticateToken, staffOrAbove, async (req, res) => {
    try {
        const { rating, page = 1, limit = 10 } = req.query;
        
        const query = {};
        if (rating) query.rating = rating;

        const feedback = await Feedback.find(query)
            .populate('orderId')
            .populate('createdBy', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Feedback.countDocuments(query);

        res.json({
            success: true,
            data: feedback,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching feedback:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch feedback',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Submit feedback (public or authenticated)
router.post('/feedback', optionalAuth, async (req, res) => {
    try {
        const { customerName, rating, comment, orderId } = req.body;

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Validate order if provided
        if (orderId) {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(400).json({
                    success: false,
                    message: 'Order not found'
                });
            }
        }

        const feedback = new Feedback({
            customerName,
            rating,
            comment,
            orderId,
            createdBy: req.userId || null
        });

        const newFeedback = await feedback.save();
        const populatedFeedback = await Feedback.findById(newFeedback._id)
            .populate('orderId')
            .populate('createdBy', 'firstName lastName username');
            
        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: populatedFeedback
        });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        res.status(400).json({ 
            success: false,
            message: 'Failed to submit feedback',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Delete feedback (manager and above)
router.delete('/feedback/:id', authenticateToken, managerOrAbove, async (req, res) => {
    try {
        const result = await Feedback.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ 
                success: false,
                message: 'Feedback not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Feedback deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting feedback:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete feedback',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Dashboard/Statistics Routes (staff and above)
router.get('/dashboard/stats', authenticateToken, staffOrAbove, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalMenuItems,
            todayOrders,
            pendingOrders,
            completedOrders,
            totalRevenue,
            averageRating
        ] = await Promise.all([
            Menu.countDocuments(),
            Order.countDocuments({ 
                createdAt: { $gte: today, $lt: tomorrow } 
            }),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'completed' }),
            Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Feedback.aggregate([
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                menuItems: totalMenuItems,
                todayOrders,
                pendingOrders,
                completedOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                averageRating: averageRating[0]?.avgRating || 0
            }
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router; 