const express = require('express');
const https = require('https');
const fs = require('fs');
const { default: mqtt } = require('mqtt');
const userRoutes = require('./routes/userRoutes.js');
const deviceRoutes = require('./routes/deviceRoutes.js');
const updateRoutes = require('./routes/updateRoutes.js');
const app = express();
const port = 443;
const errorHandler = require('./errors/errorHandler');
const db = require('./config/database.js')
const mqttService = require('./controllers/mqtt.js')
const auth = require('./middleware/auth.js');

// SSL certificate files
const options = {
    key: fs.readFileSync('certs/key.pem'),   // Replace with your key file path
    cert: fs.readFileSync('certs/cert.pem'), // Replace with your cert file path
  };

// 'mqtt://127.0.0.1:1883'; // Example: public MQTT broker


// Middleware برای پردازش JSON
app.use(express.json());
mqttService.startMqtt();

// مسیرها
app.use('/api', userRoutes);
app.use('/api/device',auth, deviceRoutes);
app.use('/api/',updateRoutes);
app.get('/google/',(req,res)=>{
    res.redirect('https://google.com');
});
// مدیریت ارورها
app.use(errorHandler);

// Create HTTPS server
const server = https.createServer(options, app);

//////////////////////////////////////////////////////////////////////////////////////////

function objectToBase64(obj) {
    // Convert the object to a JSON string
    const jsonString = JSON.stringify(obj);
    
    // Encode the JSON string to base64
    const base64String = Buffer.from(jsonString).toString('base64');
    
    return base64String;
}

function base64ToObject(base64String) {
    // Decode the base64 string to JSON
    console.log(base64String);
    const jsonString = Buffer.from(base64String, 'base64').toString();
    console.log(jsonString);
    
    // Parse the JSON string to an object
    const obj = JSON.parse(jsonString);
    
    return obj;
}

// یک روت ساده
app.get('/', (req, res) => {
    res.send('hello world!');
});

// راه اندازی سرور
// Start server
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});



process.on('SIGINT', () => {
    db.end((err) => {
        if (err) {
            console.error('Error closing the database connection:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
