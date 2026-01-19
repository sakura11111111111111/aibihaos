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
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4' // Force UTF-8mb4
});

module.exports = pool.promise();
