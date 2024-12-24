const MqttHelper = require('./modules/mqttHelper'); // Adjust the path as needed
const express = require('express');
const config = require('./modules/constants.js');
const { default: mqtt } = require('mqtt');
const userRoutes = require('./routes/userRoutes.js');
const deviceRoutes = require('./routes/deviceRoutes.js');
const app = express();
const port = 3000;
const errorHandler = require('./errors/errorHandler');
const db = require('./config/database.js')



const mqttBrokerUrl = 'mqtt://broker.emqx.io:1883';
// 'mqtt://127.0.0.1:1883'; // Example: public MQTT broker
const server_topic = 'action_server'; // Example: public MQTT broker
const report_topic = 'report_state'; // Example: public MQTT broker



// Middleware برای پردازش JSON
app.use(express.json());
const mqttClient = new MqttHelper(mqttBrokerUrl).connect();


// مسیرها
app.use('/api', userRoutes);
app.use('/api/device', deviceRoutes);

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