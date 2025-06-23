const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Menu item name cannot exceed 100 characters']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    itemId: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        enum: ['Starter', 'Main Course', 'Dessert', 'Beverage', 'Bread', 'Special'],
        default: 'Main Course'
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
menuSchema.index({ itemId: 1 });
menuSchema.index({ category: 1 });
menuSchema.index({ isAvailable: 1 });
menuSchema.index({ createdBy: 1 });

// Virtual for formatted price
menuSchema.virtual('formattedPrice').get(function() {
    return `$${this.price.toFixed(2)}`;
});

module.exports = mongoose.model('Menu', menuSchema); 