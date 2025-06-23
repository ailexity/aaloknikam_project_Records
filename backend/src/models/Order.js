const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: [true, 'Table number is required'],
        trim: true
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customerMobile: {
        type: String,
        required: false,
        trim: true,
        match: [/^[+]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid mobile number']
    },
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
        },
        _id: false // Disable _id for subdocuments
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
            message: 'Status must be one of: pending, preparing, ready, served, completed, cancelled'
        },
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'refunded'],
            message: 'Payment status must be one of: pending, paid, refunded'
        },
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for performance
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ tableNumber: 1 });
orderSchema.index({ createdBy: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for formatted total amount
orderSchema.virtual('formattedTotal').get(function() {
    return `$${this.totalAmount.toFixed(2)}`;
});

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
    if (this.updatedAt && this.createdAt) {
        const diff = this.updatedAt - this.createdAt;
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minutes`;
    }
    return null;
});

// Pre-save middleware to validate items
orderSchema.pre('save', function(next) {
    if (this.items && this.items.length === 0) {
        next(new Error('Order must contain at least one item'));
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema); 