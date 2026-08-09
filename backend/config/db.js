const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql_db',
    user: process.env.DB_USER || 'lifeskill_user',
    password: process.env.DB_PASSWORD || 'lifeskill_secret',
    database: process.env.DB_NAME || 'lifeskill_manusa',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

module.exports = pool;
