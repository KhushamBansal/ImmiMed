const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PharmacyProfile = require('../models/PharmacyProfile');

const router = express.Router();
console.log("Auth route loaded");

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Register request:', req.body);
        const { name, email, password, role, pharmacyDetails } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
        });

        const savedUser = await user.save();

        // If pharmacy, create profile
        if (role === 'pharmacy') {
            const { pharmacyName, address, contactNumber, lat, lng } = pharmacyDetails || {};
            if (!pharmacyName || !address || !contactNumber) {
                await User.findByIdAndDelete(savedUser._id);
                return res.status(400).json({ message: 'Pharmacy details required' });
            }
            const profileData = {
                userId: savedUser._id,
                pharmacyName,
                address,
                contactNumber,
            };
            // Only set location if actual coordinates were provided
            if (lat && lng) {
                profileData.location = {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)],
                };
            }
            const pharmacyProfile = new PharmacyProfile(profileData);
            await pharmacyProfile.save();
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Detailed Error:', err);
        res.status(500).json({ message: 'Server error XYZ', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
