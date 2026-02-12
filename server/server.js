const express = require('express');
const fs = require('fs');
const app = express();

// Lire le fichier
app.get('/api/config', (req, res) => {
    const config = JSON.parse(fs.readFileSync('config/users-config.json'));
    res.json(config);
});

// Écrire dans le fichier
app.post('/api/users', (req, res) => {
    // Sauvegarder dans users-config.json
});