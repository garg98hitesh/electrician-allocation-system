require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// API Endpoints
app.post('/electrician/add', (req, res) => {
    const { name, status, other_info } = req.body;
    const sql = `INSERT INTO electricians (name, status, other_info) VALUES (?, ?, ?)`;
    db.run(sql, [name, status, other_info], function (err) {
        if (err) {
            console.error('Error inserting electrician:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(201).json({ electrician_id: this.lastID, name, status, other_info });
    });
});

// API Endpoint to get electricians list
app.get('/electricians/list', (req, res) => {
    const sql = `SELECT * FROM electricians`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving electricians:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(200).json({ electricians: rows });
    });
});

// API Endpoint to get sites list
app.get('/sites/list', (req, res) => {
    const sql = `SELECT * FROM sites`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving sites:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(200).json({ sites: rows });
    });
});

// API Endpoint to add site
app.post('/site/add', (req, res) => {
    const { date, status, assignedElectricianId, other_info } = req.body;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        res.status(400).json({ error: 'Invalid date format. Date should be in YYYY-MM-DD format.' });
        return;
    }

    const sql = `INSERT INTO sites (date, status, assigned_electrician_id, other_info) VALUES (?, ?, ?, ?)`;
    db.run(sql, [date, status, assignedElectricianId, other_info], function (err) {
        if (err) {
            console.error('Error inserting site:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(201).json({ site_id: this.lastID, date, status, assignedElectricianId, other_info });
    });
});

// Assign API for assigning electrician to site based on a given date
app.post('/assign-electrician', async (req, res) => {
    try {
        const currentDate = new Date().toISOString().split('T')[0];

        // Fetch active electricians and available sites
        const activeElectricians = await db.all('SELECT id FROM electricians WHERE status = "active"');
        const availableSites = await db.all('SELECT id FROM sites WHERE date = ? AND status = "pending"', [currentDate]);

        // Check if there are available sites and active electricians
        if (availableSites.length === 0 || activeElectricians.length === 0) {
            return res.status(400).json({ error: 'No available sites or active electricians' });
        }

        const numSites = availableSites.length;
        const numElectricians = activeElectricians.length;
        const avgWorkload = Math.floor(numSites / numElectricians);
        let assignedSitesCount = 0;

        for (let i = 0; i < numElectricians; i++) {
            const electricianId = activeElectricians[i].id;
            const sitesToAssign = assignedSitesCount < numSites % numElectricians ? avgWorkload + 1 : avgWorkload;

            for (let j = 0; j < sitesToAssign; j++) {
                const siteId = availableSites[assignedSitesCount++].id;

                await db.run('UPDATE sites SET status = "assigned", assigned_electrician_id = ? WHERE id = ?', [electricianId, siteId]);
            }
        }

        res.status(200).json({ message: 'Sites assigned successfully' });
    } catch (err) {
        console.error('Error assigning sites:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
