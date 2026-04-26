const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PharmacyProfile',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    category: {
        type: String,
    },
    image: {
        type: String, // URL or base64
    },
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
