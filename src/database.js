const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('electrician_allocation_system.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create tables if not exists
db.serialize(() => {
    // Create electricians table
    db.run(`CREATE TABLE IF NOT EXISTS electricians (
        electrician_id INTEGER PRIMARY KEY,
        name TEXT,
        status BOOLEAN,
        other_info TEXT
    )`);

    // Create sites table
    db.run(`CREATE TABLE IF NOT EXISTS sites (
        site_id INTEGER PRIMARY KEY,
        date DATE,
        status TEXT,
        assigned_electrician_id INTEGER,
        other_info TEXT,
        FOREIGN KEY (assigned_electrician_id) REFERENCES electricians (electrician_id)
    )`);
});

// Close the database connection when the app exits
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing SQLite database:', err.message);
        } else {
            console.log('Closed SQLite database connection');
        }
    });
});

module.exports = db;
