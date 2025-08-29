const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const markersFile = path.join(__dirname, 'markers.json');

// --- API для маркерів ---
app.get('/markers', (req, res) => {
  if (!fs.existsSync(markersFile)) return res.json([]);
  const data = fs.readFileSync(markersFile);
  res.json(JSON.parse(data));
});

app.post('/markers', (req, res) => {
  const newMarker = req.body;
  let markers = [];
  if (fs.existsSync(markersFile)) {
    markers = JSON.parse(fs.readFileSync(markersFile));
  }
  markers.push(newMarker);
  fs.writeFileSync(markersFile, JSON.stringify(markers, null, 2));
  res.json({ status: 'ok', marker: newMarker });
});

// --- Оновлення позиції ---
app.put('/updateMarker', (req, res) => {
  const { lat, lng, userId } = req.body;
  if (!fs.existsSync(markersFile)) return res.json([]);

  let markers = JSON.parse(fs.readFileSync(markersFile));
  let marker = markers.find(m => m.userId === userId);

  if (!marker) return res.json({ status: 'not_found' });

  marker.lat = lat;
  marker.lng = lng;

  fs.writeFileSync(markersFile, JSON.stringify(markers, null, 2));
  res.json({ status: 'updated', marker });
});

// --- Видалення маркера тільки своїх ---
app.delete('/markers', (req, res) => {
  const { lat, lng, userId } = req.body;
  if (!fs.existsSync(markersFile)) return res.json([]);

  let markers = JSON.parse(fs.readFileSync(markersFile));

  const marker = markers.find(m => m.lat === lat && m.lng === lng);

  if (!marker) return res.json({ status: 'not_found' });
  if (marker.userId !== userId) return res.json({ status: 'forbidden' });

  markers = markers.filter(m => !(m.lat === lat && m.lng === lng && m.userId === userId));
  fs.writeFileSync(markersFile, JSON.stringify(markers, null, 2));
  res.json({ status: 'deleted', lat, lng });
});

// --- API для пошуку через Nominatim ---
app.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Node.js App' } });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search error' });
  }
});

// --- Головна сторінка ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'hhh.html'));
});

app.get('/dodatok.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dodatok.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
