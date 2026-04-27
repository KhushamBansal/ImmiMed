const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const PharmacyProfile = require('./models/PharmacyProfile');
const Medicine = require('./models/Medicine');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await PharmacyProfile.deleteMany({});
        await Medicine.deleteMany({});

        console.log('Cleared existing data');

        // Create Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const users = await User.create([
            { name: 'John Pharmacy', email: 'pharmacy@test.com', password: hashedPassword, role: 'pharmacy' },
            { name: 'Jane Customer', email: 'customer@test.com', password: hashedPassword, role: 'customer' },
            { name: 'Mike Delivery', email: 'delivery@test.com', password: hashedPassword, role: 'delivery' },
            { name: 'Platform Admin', email: 'admin@pharma.com', password: hashedPassword, role: 'admin' }
        ]);

        const pharmacyUser = users[0];
        const customerUser = users[1];

        // Create Pharmacy Profile
        const pharmacyProfile = await PharmacyProfile.create({
            userId: pharmacyUser._id,
            pharmacyName: 'Central City Pharmacy',
            address: '123 Main St, New York, NY',
            contactNumber: '555-0123',
            location: {
                type: 'Point',
                coordinates: [-74.0060, 40.7128] // [longitude, latitude]
            },
            isApproved: false,   // must be approved by admin first
        });

        // Create Medicines
        await Medicine.create([
            {
                pharmacyId: pharmacyProfile._id,
                name: 'Paracetamol',
                description: 'Pain reliever and fever reducer',
                price: 5.99,
                stock: 100,
                category: 'Pain Relief'
            },
            {
                pharmacyId: pharmacyProfile._id,
                name: 'Amoxicillin',
                description: 'Antibiotic used to treat bacterial infections',
                price: 12.50,
                stock: 50,
                category: 'Antibiotics'
            },
            {
                pharmacyId: pharmacyProfile._id,
                name: 'Cetirizine',
                description: 'Antihistamine for allergy relief',
                price: 8.99,
                stock: 75,
                category: 'Allergy'
            },
            {
                pharmacyId: pharmacyProfile._id,
                name: 'Ibuprofen',
                description: 'Non-steroidal anti-inflammatory drug',
                price: 7.49,
                stock: 120,
                category: 'Pain Relief'
            }
        ]);

        console.log('Database Seeded Successfully');
        console.log('Test Accounts:');
        console.log('Pharmacy: pharmacy@test.com / password123');
        console.log('Customer: customer@test.com / password123');
        console.log('Delivery: delivery@test.com / password123');
        console.log('Admin: admin@pharma.com / password123');

        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
