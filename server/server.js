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

// --- API Routes ---

// 1. Categories
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        // Convert flat list to tree (simple implementation for now, or just return flat)
        // Frontend expects a tree, but maybe we can return flat and let frontend build it?
        // Let's stick to flat list first and let store.js handle it if needed, 
        // OR better: return the flat list and let frontend util build the tree.
        // Actually, store.js expects a tree structure. Let's send flat and use existing frontend logic to build tree?
        // Wait, store.js `categories` is an array of tree nodes.
        // Let's just return flat array for now, frontend `loadCategories` can reconstruct if needed,
        // or we just send what DB has.
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    const { id, name, parent_id } = req.body;
    try {
        // Use ID from frontend if provided (for sync) or auto-inc
        // If frontend generates ID (timestamp), we might want to use that to keep consistency
        if (id) {
            await db.query('INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)', [id, name, parent_id]);
        } else {
            await db.query('INSERT INTO categories (name, parent_id) VALUES (?, ?)', [name, parent_id]);
        }
        res.status(201).json({ message: 'Category created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
        res.json({ message: 'Category updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Review Modes
app.get('/api/review-modes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM review_modes');
        // Parse intervals_json back to array
        const modes = rows.map(row => ({
            ...row,
            intervals: row.intervals_json, // MySQL JSON type is automatically parsed by mysql2
            isSystem: !!row.is_system
        }));
        res.json(modes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/review-modes', async (req, res) => {
    const { id, name, description, intervals, isSystem } = req.body;
    try {
        await db.query(
            'INSERT INTO review_modes (id, name, description, intervals_json, is_system) VALUES (?, ?, ?, ?, ?)',
            [id, name, description, JSON.stringify(intervals), isSystem]
        );
        res.status(201).json({ message: 'Review mode created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/review-modes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM review_modes WHERE id = ? AND is_system = 0', [req.params.id]);
        res.json({ message: 'Review mode deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Notes & Reviews
app.get('/api/notes', async (req, res) => {
    try {
        // Join with review status
        const [rows] = await db.query(`
            SELECT n.*, nr.mode_id, nr.current_interval_index, nr.next_review_date, nr.last_review_date 
            FROM notes n 
            LEFT JOIN note_reviews nr ON n.id = nr.note_id
        `);
        
        // Transform to frontend format
        const notes = rows.map(row => {
            const note = {
                id: row.id,
                title: row.title,
                content: row.content, // This is raw text content? Wait, schema says LONGTEXT. 
                // Frontend 'content' usually is just text preview? 
                // Ah, frontend note object has 'blocks' (from Editor.js or similar?)
                // Wait, in schema.sql: content LONGTEXT.
                // In frontend: note.blocks. 
                // We need to store JSON string in content.
                blocks: JSON.parse(row.content || '[]'),
                creationDate: row.creation_date,
                categoryId: row.category_id,
            };

            if (row.mode_id) {
                note.review = {
                    modeId: row.mode_id,
                    currentIntervalIndex: row.current_interval_index,
                    nextReviewDate: row.next_review_date,
                    lastReviewDate: row.last_review_date
                };
            }
            return note;
        });
        
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notes', async (req, res) => {
    const { id, title, blocks, creationDate, categoryId, review } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert/Update Note
        // Use INSERT ON DUPLICATE KEY UPDATE to handle both create and update
        await connection.query(
            `INSERT INTO notes (id, title, content, creation_date, category_id) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             title = VALUES(title), content = VALUES(content), category_id = VALUES(category_id)`,
            [id, title, JSON.stringify(blocks), creationDate, categoryId]
        );

        // 2. Handle Review Info
        if (review) {
            await connection.query(
                `INSERT INTO note_reviews (note_id, mode_id, current_interval_index, next_review_date, last_review_date)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 mode_id = VALUES(mode_id),
                 current_interval_index = VALUES(current_interval_index),
                 next_review_date = VALUES(next_review_date),
                 last_review_date = VALUES(last_review_date)`,
                [id, review.modeId, review.currentIntervalIndex, review.nextReviewDate, review.lastReviewDate || null]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Note saved' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
