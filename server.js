const express = require('express');
const ngrok = require('@ngrok/ngrok');
const session = require('express-session');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('fs');
const config = require('./config.json');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = config.port;
const ngrokAuthToken = config.ngrokAuthToken;
const ngrokDomain = config.ngrokDomain;

var userLoc = [];

io.on('connection', (socket) => {
    socket.on('location', (data) => {
        var latitude = data.latitude;
        var longitude = data.longitude;
        console.log('Received location:', latitude, longitude);

        // Lakukan verifikasi atau pemrosesan lokasi di sini
        // Misalnya, Anda bisa menyimpan lokasi ini di database untuk pengguna yang bersangkutan
        socket.emit('verified'); // Mengirimkan sinyal ke client bahwa lokasi telah diverifikasi
    });
});

// Middleware untuk parsing form data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret-key-yang-aman-dan-panjang', // Ganti dengan kunci rahasia yang lebih aman
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Ganti menjadi true jika menggunakan HTTPS
}));

app.get('/verification', (req, res) => {
    var html = fs.readFileSync('./request-location.html', 'utf8');
    res.send(html);
});

// Rute untuk memproses verifikasi
app.post('/verify', (req, res) => {
    if (req.body.location) {
        req.session.isVerified = true;
        res.redirect('/');
    } else {
        res.send('Lokasi diperlukan untuk verifikasi.');
    }
});

app.use((req, res, next) => {
    if (req.session.isVerified || req.path === '/verification' || req.path === '/verify') {
        next();
    } else {
        res.redirect('/verification');
    }
});

app.use(express.static('public'));

server.listen(port, async () => {
    try {
        const url = await ngrok.connect({
            addr: port,
            authtoken: ngrokAuthToken,
            hostname: ngrokDomain
        });
        console.log(`Server ngrok berjalan di https://${ngrokDomain}`);
    } catch (error) {
        console.error('Error starting ngrok:', error);
    }
});
