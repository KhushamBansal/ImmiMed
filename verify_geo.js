const mongoose = require('mongoose');
const PharmacyProfile = require('./server/models/PharmacyProfile');
const dotenv = require('dotenv');

dotenv.config();

const verifyGeo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pharmacy-platform'); // Fallback purely for example
        console.log('Connected to MongoDB');

        // Clean up previous test data if needed, or just insert new
        // For safety, let's just insert one test pharmacy with location
        const testPharma = new PharmacyProfile({
            userId: new mongoose.Types.ObjectId(),
            pharmacyName: 'Test Geo Pharma ' + Date.now(),
            address: '123 Test St',
            contactNumber: '1234567890',
            isApproved: true,
            location: {
                type: 'Point',
                coordinates: [-122.4194, 37.7749] // San Francisco
            }
        });

        await testPharma.save();
        console.log('Test pharmacy saved with location');

        // Now query nearby
        const nearby = await PharmacyProfile.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [-122.4194, 37.7749]
                    },
                    $maxDistance: 1000
                }
            },
            isApproved: true
        });

        console.log(`Found ${nearby.length} nearby pharmacies.`);
        if (nearby.length > 0) {
            console.log('Verification SUCCESS');
        } else {
            console.log('Verification FAILED: No pharmacies found nearby');
        }

        // Cleanup
        await PharmacyProfile.findByIdAndDelete(testPharma._id);
        console.log('Cleanup done');

    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

verifyGeo();
