const mysql = require('mysql2');
const dotenv = require('dotenv');

// Ensure env vars are loaded (though server.js loads them too)
dotenv.config({ override: true });

console.log('----- DB CONNECTION DEBUG -----');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'advanced_notes_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
