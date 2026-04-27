# ImmiMed - Pharmacy Platform

A comprehensive pharmacy management and medicine delivery platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Project Structure
- `/server`: Node.js/Express backend with MongoDB/Mongoose.
- `/client`: React frontend built with Vite and TailwindCSS.

---

## Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)

---

## Getting Started

### 1. Installation
Install dependencies for both the server and the client:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Setup
Create a `.env` file in the `server` directory and add your configuration:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Database Seeding
Populate the database with initial test data (users, pharmacy profile, and medicines):

```bash
cd server
npm run seed
```

### 4. Running the Application

You will need two terminal windows to run both parts of the application.

#### Start the Server
```bash
cd server
npm run dev
```
The server will run at `http://localhost:5000`.

#### Start the Client
```bash
cd client
npm run dev
```
The frontend will run at `http://localhost:5173` (or the port specified by Vite).

---

## Test Accounts
After running the seed script, you can use the following credentials to test the platform:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Pharmacy** | `pharmacy@test.com` | `password123` |
| **Customer** | `customer@test.com` | `password123` |
| **Delivery** | `delivery@test.com` | `password123` |

---

## API Endpoints
- `GET /api/auth` - Authentication routes
- `GET /api/pharmacy` - Pharmacy profiles and medicine listings
- `GET /api/orders` - Order management
- `GET /api/admin` - Admin dashboard and approvals
