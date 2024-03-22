const sqlite3 = require('sqlite3').verbose();

// Specify the filename for the SQLite database
const DB_FILE = 'mydatabase.db';

// Create database connection
const db = new sqlite3.Database(DB_FILE);

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS electricians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        status TEXT,
        other_info TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        status TEXT,
        assigned_electrician_id INTEGER,
        other_info TEXT
    )`);
});

module.exports = db;
