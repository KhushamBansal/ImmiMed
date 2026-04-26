const express = require('express');
const User = require('../models/User');
const PharmacyProfile = require('../models/PharmacyProfile');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware — admin only
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// ------- STATS -------
// GET /api/admin/stats
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const [totalUsers, totalPharmacies, pendingPharmacies, totalOrders, emergencyOrders] = await Promise.all([
            User.countDocuments(),
            PharmacyProfile.countDocuments(),
            PharmacyProfile.countDocuments({ isApproved: false }),
            Order.countDocuments(),
            Order.countDocuments({ isEmergency: true }),
        ]);

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'name email')
            .populate('pharmacyId', 'pharmacyName');

        res.json({
            totalUsers,
            totalPharmacies,
            pendingPharmacies,
            totalOrders,
            emergencyOrders,
            recentOrders,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ------- PHARMACIES -------
// GET /api/admin/pharmacies?status=pending|approved|all
router.get('/pharmacies', auth, isAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status === 'pending') query.isApproved = false;
        if (status === 'approved') query.isApproved = true;

        const pharmacies = await PharmacyProfile.find(query)
            .populate('userId', 'name email createdAt')
            .sort({ createdAt: -1 });

        res.json(pharmacies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/pharmacies/:id/approve
router.put('/pharmacies/:id/approve', auth, isAdmin, async (req, res) => {
    try {
        const pharmacy = await PharmacyProfile.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        ).populate('userId', 'name email');

        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json({ message: 'Pharmacy approved', pharmacy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/pharmacies/:id/reject
router.put('/pharmacies/:id/reject', auth, isAdmin, async (req, res) => {
    try {
        const pharmacy = await PharmacyProfile.findByIdAndUpdate(
            req.params.id,
            { isApproved: false },
            { new: true }
        ).populate('userId', 'name email');

        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json({ message: 'Pharmacy rejected/suspended', pharmacy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/pharmacies/:id
router.delete('/pharmacies/:id', auth, isAdmin, async (req, res) => {
    try {
        const pharmacy = await PharmacyProfile.findById(req.params.id);
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });

        // Also delete medicines and user account
        await Medicine.deleteMany({ pharmacyId: pharmacy._id });
        await User.findByIdAndDelete(pharmacy.userId);
        await PharmacyProfile.findByIdAndDelete(req.params.id);

        res.json({ message: 'Pharmacy deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ------- ORDERS -------
// GET /api/admin/orders
router.get('/orders', auth, isAdmin, async (req, res) => {
    try {
        const { emergency } = req.query;
        const query = {};
        if (emergency === 'true') query.isEmergency = true;

        const orders = await Order.find(query)
            .sort({ isEmergency: -1, createdAt: -1 })
            .populate('customerId', 'name email')
            .populate('pharmacyId', 'pharmacyName address');

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ------- USERS -------
// GET /api/admin/users
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
