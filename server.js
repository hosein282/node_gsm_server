const express = require('express');
const { default: mqtt } = require('mqtt');
const userRoutes = require('./routes/userRoutes.js');
const deviceRoutes = require('./routes/deviceRoutes.js');
const updateRoutes = require('./routes/updateRoutes.js');
const app = express();
const port = 3000;
const errorHandler = require('./errors/errorHandler');
const db = require('./config/database.js')
const mqttService = require('./controllers/mqtt.js')
const auth = require('./middleware/auth.js');


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
   const  {base64} =  req.params;
   console.log(base64);
    const data = {
        message: 'Welcome to my API!',
        base64: objectToBase64('{Welcome to my API!}'),
        text: base64ToObject(base64),
    };
    res.send(data);
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