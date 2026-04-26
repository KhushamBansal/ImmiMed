const axios = require('axios');

const API = 'http://localhost:5000/api';

async function verify() {
    try {
        console.log('Starting Verification...');

        // 1. Register Pharmacy
        const pharmacyEmail = `pharma_${Date.now()}@test.com`;
        console.log(`Registering Pharmacy: ${pharmacyEmail}`);
        await axios.post(`${API}/auth/register`, {
            name: 'Test Pharma',
            email: pharmacyEmail,
            password: 'password123',
            role: 'pharmacy',
            pharmacyDetails: {
                pharmacyName: 'Best Meds',
                address: '123 Main St',
                contactNumber: '555-0199'
            }
        });

        // Login Pharmacy
        const pharmaRes = await axios.post(`${API}/auth/login`, {
            email: pharmacyEmail,
            password: 'password123'
        });
        const pharmaToken = pharmaRes.data.token;
        console.log('Pharmacy Logged In');

        // 2. Add Medicine
        console.log('Adding Medicine...');
        const medRes = await axios.post(`${API}/pharmacy/medicine`, {
            name: 'Aspirin',
            price: 10,
            stock: 100,
            description: 'Pain relief'
        }, { headers: { 'x-auth-token': pharmaToken } });
        const medicineId = medRes.data._id;
        console.log(`Medicine Added: ${medicineId}`);

        // 3. Register Customer
        const customerEmail = `cust_${Date.now()}@test.com`;
        console.log(`Registering Customer: ${customerEmail}`);
        await axios.post(`${API}/auth/register`, {
            name: 'John Doe',
            email: customerEmail,
            password: 'password123',
            role: 'customer'
        });

        // Login Customer
        const custRes = await axios.post(`${API}/auth/login`, {
            email: customerEmail,
            password: 'password123'
        });
        const custToken = custRes.data.token;
        console.log('Customer Logged In');

        // 4. Place Order
        console.log('Placing Order...');
        // Need pharmacy ID - fetch pharmacies first
        const pharmListRes = await axios.get(`${API}/pharmacy`);
        const pharmacyId = pharmListRes.data.find(p => p.pharmacyName === 'Best Meds')._id;

        const orderRes = await axios.post(`${API}/orders`, {
            pharmacyId: pharmacyId,
            items: [{ medicineId, quantity: 2 }],
            deliveryAddress: '456 Order Ln'
        }, { headers: { 'x-auth-token': custToken } });

        console.log(`Order Placed: ${orderRes.data._id} - Status: ${orderRes.data.status}`);

        console.log('Verification Successful!');
    } catch (err) {
        console.error('Verification Failed:', err.response ? err.response.data : err.message);
    }
}

verify();
