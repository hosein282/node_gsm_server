const express = require('express');
const { default: mqtt } = require('mqtt');
const userRoutes = require('./routes/userRoutes.js');
const deviceRoutes = require('./routes/deviceRoutes.js');
const app = express();
const port = 3000;
const errorHandler = require('./errors/errorHandler');
const db = require('./config/database.js')
const mqttService = require('./controllers/mqtt.js')
const auth = require('./middleware/auth.js');



// 'mqtt://127.0.0.1:1883'; // Example: public MQTT broker
const server_topic = 'action_server'; // Example: public MQTT broker
const report_topic = 'report_state'; // Example: public MQTT broker



// Middleware برای پردازش JSON
app.use(express.json());
mqttService.startMqtt();

// مسیرها
app.use('/api', userRoutes);
app.use('/api/device',auth, deviceRoutes);

// مدیریت ارورها
app.use(errorHandler);




//////////////////////////////////////////////////////////////////////////////////////////

// یک روت ساده
app.get('/', (req, res) => {
    res.send('Welcome to my API!');
});


// راه اندازی سرور
app.listen(port, () => {
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