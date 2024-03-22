require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Assign API for assigning electrician to site based on a given date
app.post('/assign', (res) => {
    // Get all active electricians
    const activeElectriciansSQL = `SELECT id FROM electricians WHERE status = 'active'`;
    db.all(activeElectriciansSQL, [], (err, activeElectricians) => {
        if (err) {
            console.error('Error fetching active electricians:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Get all available sites
        const availableSitesSQL = `SELECT id FROM sites WHERE status = 'available'`;
        db.all(availableSitesSQL, [], (err, availableSites) => {
            if (err) {
                console.error('Error fetching available sites:', err.message);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            // Calculate the number of sites and active electricians
            const numSites = availableSites.length;
            const numElectricians = activeElectricians.length;

            if (numSites === 0 || numElectricians === 0) {
                res.status(400).json({ error: 'No available sites or active electricians' });
                return;
            }

            // Calculate the average workload per electrician
            const avgWorkload = Math.floor(numSites / numElectricians);

            // Assign sites to electricians
            let assignedSitesCount = 0;
            let electricianIndex = 0;
            activeElectricians.forEach((electrician) => {
                const sitesToAssign = (electricianIndex < numSites % numElectricians) ? avgWorkload + 1 : avgWorkload;
                const electricianId = electrician.id;
                for (let i = 0; i < sitesToAssign; i++) {
                    const siteId = availableSites[assignedSitesCount++].id;
                    const assignSiteSQL = `UPDATE sites SET status = 'assigned', assigned_electrician_id = ? WHERE id = ?`;
                    db.run(assignSiteSQL, [electricianId, siteId], (err) => {
                        if (err) {
                            console.error('Error assigning site:', err.message);
                            res.status(500).json({ error: 'Internal server error' });
                            return;
                        }
                    });
                }
                electricianIndex++;
            });

            res.status(200).json({ message: 'Sites assigned successfully' });
        });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
