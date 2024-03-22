const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// API Endpoints
app.post('/electrician/add', (req, res) => {
    const { name, status, otherInfo } = req.body;
    const sql = `INSERT INTO electricians (name, status, other_info) VALUES (?, ?, ?)`;
    db.run(sql, [name, status, otherInfo], function(err) {
        if (err) {
            console.error('Error inserting electrician:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(201).json({ electrician_id: this.lastID, name, status, otherInfo });
    });
});

app.post('/site/add', (req, res) => {
    const { date, status, assignedElectricianId, otherInfo } = req.body;
    const sql = `INSERT INTO sites (date, status, assigned_electrician_id, other_info) VALUES (?, ?, ?, ?)`;
    db.run(sql, [date, status, assignedElectricianId, otherInfo], function(err) {
        if (err) {
            console.error('Error inserting site:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(201).json({ site_id: this.lastID, date, status, assignedElectricianId, otherInfo });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
