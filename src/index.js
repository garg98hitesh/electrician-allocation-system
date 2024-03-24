require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const geolib = require('geolib'); // Importing geolib library for distance calculation

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// API Endpoints
app.post('/electrician/add', (req, res) => {
    const { name, status, other_info, state, city } = req.body;
    const sql = `INSERT INTO electricians (name, status, other_info, state, city) VALUES (?, ?, ?, ?, ?)`;
    const values = [name, status, JSON.stringify(other_info), state, city];

    db.run(sql, values, function (err) {
        if (err) {
            console.error('Error inserting electrician:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(201).json({ electrician_id: this.lastID, name, status, other_info, state, city });
    });
});

app.post('/site/add', (req, res) => {
    const { date, status, assignedElectricianId, other_info, state, city } = req.body;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        res.status(400).json({ error: 'Invalid date format. Date should be in YYYY-MM-DD format.' });
        return;
    }

    const sql = `INSERT INTO sites (date, status, assigned_electrician_id, other_info, state, city) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [date, status, assignedElectricianId, JSON.stringify(other_info), state, city];

    db.run(sql, values, function (err) {
        if (err) {
            console.error('Error inserting site:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(201).json({ site_id: this.lastID, date, status, assignedElectricianId, other_info, state, city });
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

app.post('/assign-electrician', (req, res) => {
    const currentDate = new Date().toISOString().split('T')[0];

    const activeElectriciansSQL = `SELECT id, other_info FROM electricians WHERE status = 'active'`;

    db.all(activeElectriciansSQL, [], (err, activeElectricians) => {
        if (err) {
            console.error('Error fetching active electricians:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        const availableSitesSQL = `SELECT id, other_info FROM sites WHERE date = ? AND status = 'pending'`;

        db.all(availableSitesSQL, [currentDate], (err, availableSites) => {
            if (err) {
                console.error('Error fetching available sites:', err.message);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (availableSites.length === 0 || activeElectricians.length === 0) {
                res.status(400).json({ error: 'No available sites or active electricians' });
                return;
            }

            availableSites.forEach(site => {
                activeElectricians.forEach(electrician => {
                    if (electrician.other_info && site.other_info) {

                        const electricianCoords = JSON.parse(electrician.other_info);
                        const siteCoords = JSON.parse(site.other_info);

                        const distance = geolib.getDistance(
                            { latitude: electricianCoords.residence_lat, longitude: electricianCoords.residence_long },
                            { latitude: siteCoords.site_lat, longitude: siteCoords.site_long }
                        );

                        console.log(distance, "distance")

                        if (distance <= 15000) { // Distance is in meters, so 15000 meters = 15 kilometers
                            const assignSiteSQL = `UPDATE sites SET status = 'assigned', assigned_electrician_id = ? WHERE id = ?`;
                            db.run(assignSiteSQL, [electrician.id, site.id], (err) => {
                                if (err) {
                                    console.error('Error assigning site:', err.message);
                                    res.status(500).json({ error: 'Internal server error' });
                                    return;
                                }
                            });
                        }
                    }
                });
            });

            res.status(200).json({ message: 'Sites assigned successfully' });
        });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
