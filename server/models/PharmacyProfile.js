const mongoose = require('mongoose');

const pharmacyProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    pharmacyName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    operatingHours: {
        type: String,
        default: '9:00 AM – 9:00 PM',
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalOrders: {
        type: Number,
        default: 0,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            index: '2dsphere',
        }
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

pharmacyProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PharmacyProfile', pharmacyProfileSchema);
