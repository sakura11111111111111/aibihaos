const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars with override to ensure .env takes precedence over system vars
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Advanced Notes API' });
});

// Import DB connection (to test it)
const db = require('./config/db');

app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: 'Database connection successful', result: rows[0].result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
