const express = require('express');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const PharmacyProfile = require('../models/PharmacyProfile');
const auth = require('../middleware/auth');

const router = express.Router();

const EMERGENCY_SURCHARGE = 50;

// Create Order (Customer)
router.post('/', auth, async (req, res) => {
    try {
        const { pharmacyId, items, deliveryAddress, isEmergency } = req.body;

        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can order' });
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const medicine = await Medicine.findById(item.medicineId);
            if (!medicine) {
                return res.status(404).json({ message: `Medicine ${item.medicineId} not found` });
            }
            if (medicine.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
            }
            medicine.stock -= item.quantity;
            await medicine.save();

            orderItems.push({
                medicineId: medicine._id,
                name: medicine.name,
                quantity: item.quantity,
                price: medicine.price,
            });
            totalAmount += medicine.price * item.quantity;
        }

        const emergencySurcharge = isEmergency ? EMERGENCY_SURCHARGE : 0;
        totalAmount += emergencySurcharge;

        const order = new Order({
            customerId: req.user.id,
            pharmacyId,
            items: orderItems,
            totalAmount,
            isEmergency: !!isEmergency,
            emergencySurcharge,
            deliveryAddress,
            status: 'pending',
        });

        await order.save();

        // Bump pharmacy totalOrders
        await PharmacyProfile.findByIdAndUpdate(pharmacyId, { $inc: { totalOrders: 1 } });

        res.status(201).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get My Orders (Customer)
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Pharmacy Orders — emergency orders first (Pharmacy)
router.get('/pharmacy-orders', auth, async (req, res) => {
    try {
        const pharmacy = await PharmacyProfile.findOne({ userId: req.user.id });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy profile not found' });
        }

        const orders = await Order.find({ pharmacyId: pharmacy._id })
            .sort({ isEmergency: -1, createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Order Status (Pharmacy/Delivery)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role === 'delivery') {
            if (status === 'out_for_delivery') {
                order.deliveryBoyId = req.user.id;
            }
        }

        order.status = status;
        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Available Orders — emergency first (Delivery Boy)
router.get('/available-orders', auth, async (req, res) => {
    try {
        if (req.user.role !== 'delivery') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const orders = await Order.find({
            status: 'ready_for_pickup',
            deliveryBoyId: { $exists: false }
        }).sort({ isEmergency: -1, createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get My Deliveries (Delivery Boy)
router.get('/my-deliveries', auth, async (req, res) => {
    try {
        if (req.user.role !== 'delivery') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const orders = await Order.find({ deliveryBoyId: req.user.id })
            .sort({ isEmergency: -1, createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
