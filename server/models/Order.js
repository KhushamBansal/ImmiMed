const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PharmacyProfile',
        required: true,
    },
    items: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
        },
        name: String,
        quantity: Number,
        price: Number,
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    isEmergency: {
        type: Boolean,
        default: false,
    },
    emergencySurcharge: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deliveryAddress: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
