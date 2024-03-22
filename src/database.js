const sqlite3 = require('sqlite3').verbose();

// Create database connection
const db = new sqlite3.Database(':memory:'); // In-memory database for simplicity

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
