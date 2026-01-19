const db = require('../config/db');

exports.getAllReviewModes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM review_modes');
        const modes = rows.map(row => ({
            ...row,
            intervals: row.intervals_json, 
            isSystem: !!row.is_system
        }));
        res.json(modes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createReviewMode = async (req, res) => {
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
};

exports.deleteReviewMode = async (req, res) => {
    try {
        await db.query('DELETE FROM review_modes WHERE id = ? AND is_system = 0', [req.params.id]);
        res.json({ message: 'Review mode deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
