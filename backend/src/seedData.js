const mongoose = require('mongoose');
const Menu = require('./models/Menu');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB for seeding');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // Get or create admin user
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('⚠️ No admin user found, creating default admin...');
            await User.createDefaultAdmin();
            adminUser = await User.findOne({ role: 'admin' });
        }

        // Check if menu items already exist
        const existingItems = await Menu.countDocuments();
        if (existingItems > 0) {
            console.log('📋 Menu items already exist, skipping seed...');
            return;
        }

        // Sample menu items
        const menuItems = [
            {
                name: 'Classic Burger',
                price: 12.99,
                itemId: 'BURG01',
                category: 'Main Course',
                description: 'Juicy beef patty with lettuce, tomato, and special sauce',
                isAvailable: true,
                createdBy: adminUser._id
            },
            {
                name: 'Margherita Pizza',
                price: 15.99,
                itemId: 'PIZZ01',
                category: 'Main Course',
                description: 'Fresh mozzarella, tomato sauce, and basil',
                isAvailable: true,
                createdBy: adminUser._id
            },
            {
                name: 'Caesar Salad',
                price: 8.99,
                itemId: 'SAL01',
                category: 'Starter',
                description: 'Crisp romaine lettuce with parmesan and croutons',
                isAvailable: true,
                createdBy: adminUser._id
            },
            {
                name: 'Chicken Pasta',
                price: 14.99,
                itemId: 'PAST01',
                category: 'Main Course',
                description: 'Creamy alfredo pasta with grilled chicken',
                isAvailable: true,
                createdBy: adminUser._id
            },
            {
                name: 'Chocolate Cake',
                price: 6.99,
                itemId: 'DESS01',
                category: 'Dessert',
                description: 'Rich chocolate cake with chocolate frosting',
                isAvailable: true,
                createdBy: adminUser._id
            },
            {
                name: 'Fresh Orange Juice',
                price: 4.99,
                itemId: 'BEV01',
                category: 'Beverage',
                description: 'Freshly squeezed orange juice',
                isAvailable: true,
                createdBy: adminUser._id
            },
            {
                name: 'Garlic Bread',
                price: 5.99,
                itemId: 'BREAD01',
                category: 'Bread',
                description: 'Toasted bread with garlic butter and herbs',
                isAvailable: true,
                createdBy: adminUser._id
            },
            {
                name: 'Chef\'s Special Steak',
                price: 24.99,
                itemId: 'SPEC01',
                category: 'Special',
                description: 'Premium ribeye steak with seasonal vegetables',
                isAvailable: true,
                createdBy: adminUser._id
            }
        ];

        // Insert menu items
        const insertedItems = await Menu.insertMany(menuItems);
        console.log(`✅ Successfully seeded ${insertedItems.length} menu items`);

        // Display summary
        const categoryCount = await Menu.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        console.log('\n📊 Menu Summary:');
        categoryCount.forEach(cat => {
            console.log(`   ${cat._id}: ${cat.count} items`);
        });

    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
    }
};

const runSeed = async () => {
    await connectDB();
    await seedData();
    
    console.log('\n🎉 Seeding completed!');
    mongoose.connection.close();
    process.exit(0);
};

// Run if called directly
if (require.main === module) {
    runSeed();
}

module.exports = { seedData, connectDB }; 