const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

// Load env vars with override to ensure .env takes precedence over system vars
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notes', require('./routes/notes'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/review-modes', require('./routes/reviewModes'));

app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: 'Database connection successful', result: rows[0].result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

// Clear all data (For development/reset)
app.post('/api/clear-all-data', async (req, res) => {
    try {
        // Disable foreign key checks to allow truncating tables with relationships
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        
        await db.query('TRUNCATE TABLE note_reviews');
        await db.query('TRUNCATE TABLE notes');
        await db.query('TRUNCATE TABLE categories');
        
        // Re-insert default categories
        await db.query("INSERT INTO categories (id, name, parent_id) VALUES (1, '高数冲刺', NULL), (2, '二重积分', NULL), (3, '大营销项目', NULL)");
        
        // Re-insert default review modes (to fix potential encoding issues)
        await db.query('TRUNCATE TABLE review_modes');
        await db.query(`
            INSERT INTO review_modes (id, name, description, intervals_json, is_system) VALUES 
            ('ebbinghaus_default', '艾宾浩斯 (系统推荐)', '基于经典遗忘曲线，适合长期记忆', '[1, 1, 2, 3, 5, 8, 15, 30, 60]', 1),
            ('custom_weekly', '每周回顾', '每周一次，共复习4次', '[7, 7, 7, 7]', 1)
        `);

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        res.json({ message: 'All notes and reviews cleared successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to clear data', error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
