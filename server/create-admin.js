/**
 * Create Admin User Script
 * Run: /opt/homebrew/bin/node create-admin.js
 *
 * Creates an admin account with:
 *   Email:    admin@pharma.com
 *   Password: admin123
 *
 * Change the values below before running if you want different credentials.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_EMAIL = 'admin@pharma.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Platform Admin';

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ MongoDB connected');

        const existing = await User.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
                console.log('✓ Role updated to admin');
            }
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        const admin = new User({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
        });

        await admin.save();
        console.log('✅ Admin user created!');
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('\n👉 Login at http://localhost:5173/login');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();
