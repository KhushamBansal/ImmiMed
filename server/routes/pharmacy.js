const express = require('express');
const Medicine = require('../models/Medicine');
const PharmacyProfile = require('../models/PharmacyProfile');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is pharmacy
const isPharmacy = async (req, res, next) => {
    if (req.user.role !== 'pharmacy') {
        return res.status(403).json({ message: 'Access denied. Pharmacy only.' });
    }
    next();
};

// Middleware to check if pharmacy is approved by admin
const isApproved = async (req, res, next) => {
    try {
        const pharmacy = await PharmacyProfile.findOne({ userId: req.user.id });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy profile not found.' });
        }
        if (!pharmacy.isApproved) {
            return res.status(403).json({
                message: 'Your pharmacy account is pending admin approval. You cannot perform this action yet.',
                pendingApproval: true,
            });
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add Medicine
router.post('/medicine', auth, isPharmacy, isApproved, async (req, res) => {
    try {
        const { name, description, price, stock, category, image } = req.body;
        const pharmacy = await PharmacyProfile.findOne({ userId: req.user.id });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy profile not found' });
        }

        const medicine = new Medicine({
            pharmacyId: pharmacy._id,
            name,
            description,
            price,
            stock,
            category,
            image,
        });

        await medicine.save();
        res.status(201).json(medicine);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Medicine Stock/Details
router.put('/medicine/:id', auth, isPharmacy, isApproved, async (req, res) => {
    try {
        const { stock, price } = req.body;
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            { stock, price },
            { new: true }
        );
        if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
        res.json(medicine);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Medicine
router.delete('/medicine/:id', auth, isPharmacy, isApproved, async (req, res) => {
    try {
        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: 'Medicine deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get My Medicines (with optional search)
router.get('/my-medicines', auth, isPharmacy, isApproved, async (req, res) => {
    try {
        const pharmacy = await PharmacyProfile.findOne({ userId: req.user.id });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy profile not found' });
        }
        const { search } = req.query;
        const query = { pharmacyId: pharmacy._id };
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        const medicines = await Medicine.find(query);
        res.json(medicines);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get My Profile
router.get('/my-profile', auth, isPharmacy, async (req, res) => {
    try {
        const pharmacy = await PharmacyProfile.findOne({ userId: req.user.id });
        if (!pharmacy) return res.status(404).json({ message: 'Profile not found' });
        res.json(pharmacy);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update My Profile (including location)
router.put('/my-profile', auth, isPharmacy, async (req, res) => {
    try {
        const { lat, lng, operatingHours, contactNumber, address } = req.body;
        const update = {};
        if (operatingHours) update.operatingHours = operatingHours;
        if (contactNumber) update.contactNumber = contactNumber;
        if (address) update.address = address;
        if (lat && lng) {
            update.location = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)],
            };
        }
        const pharmacy = await PharmacyProfile.findOneAndUpdate(
            { userId: req.user.id },
            update,
            { new: true }
        );
        res.json(pharmacy);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Global Medicine Search across all approved pharmacies
router.get('/search-medicines', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        // Get all approved pharmacies
        const approvedPharmacies = await PharmacyProfile.find({ isApproved: true }).select('_id pharmacyName address');
        const approvedIds = approvedPharmacies.map(p => p._id);
        const pharmacyMap = {};
        approvedPharmacies.forEach(p => { pharmacyMap[p._id.toString()] = p; });

        const medicines = await Medicine.find({
            pharmacyId: { $in: approvedIds },
            name: { $regex: query, $options: 'i' },
        }).limit(50);

        // Attach pharmacy info
        const results = medicines.map(med => ({
            ...med.toObject(),
            pharmacy: pharmacyMap[med.pharmacyId.toString()] || null,
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Nearby Pharmacies
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, dist } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const pharmacies = await PharmacyProfile.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(dist) || 5000
                }
            },
            isApproved: true
        });

        res.json(pharmacies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get All Pharmacies (with optional name search)
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        const query = { isApproved: true };
        if (search) {
            query.pharmacyName = { $regex: search, $options: 'i' };
        }
        const pharmacies = await PharmacyProfile.find(query);
        res.json(pharmacies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Pharmacy Menu (with optional medicine search)
router.get('/:pharmacyId/medicines', async (req, res) => {
    try {
        const { search } = req.query;
        const query = { pharmacyId: req.params.pharmacyId };
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        const medicines = await Medicine.find(query);
        res.json(medicines);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
