const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be a whole number'
        }
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    createdBy: {
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
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ createdBy: 1 });
feedbackSchema.index({ createdAt: -1 });

// Virtual for star display
feedbackSchema.virtual('stars').get(function() {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Static method to get average rating
feedbackSchema.statics.getAverageRating = async function() {
    const result = await this.aggregate([
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalFeedback: { $sum: 1 }
            }
        }
    ]);
    
    return result[0] || { averageRating: 0, totalFeedback: 0 };
};

// Static method to get rating distribution
feedbackSchema.statics.getRatingDistribution = async function() {
    const result = await this.aggregate([
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
    
    // Create array with all ratings 1-5
    const distribution = Array(5).fill(0);
    result.forEach(item => {
        distribution[item._id - 1] = item.count;
    });
    
    return distribution;
};

module.exports = mongoose.model('Feedback', feedbackSchema); 