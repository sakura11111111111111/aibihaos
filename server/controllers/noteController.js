const db = require('../config/db');

exports.getAllNotes = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT n.*, nr.mode_id, nr.current_interval_index, nr.next_review_date, nr.last_review_date 
            FROM notes n 
            LEFT JOIN note_reviews nr ON n.id = nr.note_id
        `);
        
        const notes = rows.map(row => {
            const note = {
                id: row.id,
                title: row.title,
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
};

exports.saveNote = async (req, res) => {
    const { id, title, blocks, creationDate, categoryId, review } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            `INSERT INTO notes (id, title, content, creation_date, category_id) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             title = VALUES(title), content = VALUES(content), category_id = VALUES(category_id)`,
            [id, title, JSON.stringify(blocks), creationDate, categoryId]
        );

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
};

exports.deleteNote = async (req, res) => {
    try {
        await db.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
