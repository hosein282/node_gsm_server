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
const mqttClient = new MqttHelper(mqttBrokerUrl);


// مسیرها
app.use('/api', userRoutes);
app.use('/api/device', deviceRoutes);

// مدیریت ارورها
app.use(errorHandler);

startMqtt();



async function startMqtt() {

    try {
        await mqttClient.connect();
        await mqttClient.subscribe(config.server_topic);
        // await mqttClient.subscribe(config.report_topic);
        console.log(mqttBrokerUrl);
        // Handler for incoming messages
        mqttClient.onMessage((topic, message) => {
            console.log(`Received message on topic ${topic}: ${message}`);
            const data = JSON.parse(message);
            console.log(typeof payload);

            handleMqttReport(data);
            // report by device
            if (topic === config.server_topic) {

                // console.log('HASSSSSSSSSSS');
                // console.log(data.temperature);

                // do action 
            } else if (topic === config.report_topic) {
                // handleMqttMessage(data);

            }

        });


        // Publish a message as an example
        // await mqttClient.publish(, 'Hello from MQTT Helper!');
    } catch (error) {
        console.error('Error in MQTT operation:', error);
    }

    // Cleanup / disconnect the client when needed
    // Uncomment to disconnect after 10 seconds for cleanup
    // setTimeout(async () => {
    //     await mqttClient.disconnect();
    // }, 10000);
}


function handleMqttReport(message) {

    const { event, operator, temperature, mac, settingList, states } = message;

    if (event === 'report') {
        const sql = `UPDATE devices SET outStates =  '${states}', temperature = '${Number(temperature)}', operator = '${operator}',
        setting = '${settingList}'  WHERE mac = '${mac}' `;
        db.execute(sql, [], (err, results) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ error: 'Failed to insert data.' });
            }
            console.log(results);
            if (results.serverStatus == 2) {
                console.log(results.serverStatus);
            }
        });

    } else if (event === 'feedback') {
        const topic = "sub" + ">" + mac;
        mqttClient.publish(topic, JSON.stringify(message));
    } else if (event === 'io') {
        handleMqttMessage(message);
    }

    console.log(mac);




}
function handleMqttMessage(message) {

    const { mac, out, state ,event} = message; // Destructure the body
    if (mac != "" && mac != undefined) {

        const topic = "action" + ">" + mac;
        const data = { 'out': out, 'state': state ,'event' : event};
        mqttClient.publish(topic, JSON.stringify(data));
    } else {
        console.log("receiver device is not initialized!");
    }

}




//////////////////////////////////////////////////////////////////////////////////////////

// یک روت ساده
app.get('/', (req, res) => {
    res.send('Welcome to my API!');
});

// route: POST request to insert data into the database
// app.post('/api/signup', (req, res) => {
//     const { username, password } = req.body; // Destructure the body

//     // SQL query to insert data
//     const sql = "SELECT * FROM users WHERE username = '" + username + "'";


//     db.execute(sql, [username, password], (err, results) => {
//         if (err) {
//             console.error('Error inserting data:', err);
//             return res.status(500).json({ error: 'Failed to insert data.' });
//         }
//         console.log(results);

//         if (results.length > 0) {
//             console.log("This User Is Already Exist!");
//             return res.status(500).json({ error: 'این نام کاربری قبلا ثبت شده است' });
//         }

//         // Create New User
//         const sql = `INSERT INTO users (username,password) VALUES ('${username}', '${password}' )`;

//         db.execute(sql, [username, password], (err, results) => {
//             if (err) {
//                 console.error('Error inserting data:', err);
//                 return res.status(500).json({ error: 'Failed to insert data.' });
//             }
//             console.log(results);

//             if (results.serverStatus == 2) {
//                 console.log("User Created!");
               
//                 console.log("User Created!");
//                 const get = `SELECT id , username FROM users WHERE username = '${username}' AND password = '${password}'`;

//                 db.execute(get, [username, password], (err, user) => {
//                     if (err) {
//                         console.error('Error inserting data:', err);
//                         return res.status(500).json({ error: 'Failed to get user.' });
//                     }
//                     console.log(user);

//                     if (results.serverStatus == 2) {
//                         console.log("User Created!");
//                         return res.status(200).json({ status: "User Created", "user": user[0] });
//                     }
//                 }

//                 )
//             }

//         });


//     });
// });



// مثال روت برای دریافت داده‌ها
// app.post('/api/signin', (req, res) => {
//     const { username, password } = req.body; // Destructure the body

//     const sql = `SELECT * FROM users WHERE username = '${username}' and password = '${password}' `;

//     db.execute(sql, [username, password], (err, results) => {
//         if (err) {
//             console.error('Error inserting data:', err);
//             return res.status(500).json({ error: 'Failed to insert data.' });
//         }
//         console.log(results);

//         if (results.length > 0) {
//             console.log("This User Is Already Exist!");
//             const query = `SELECT * FROM devices WHERE user_id =  ${results[0].id}  `;

//             db.execute(query, [username, password], (err, devices) => {
//                 if (err) {
//                     console.error('Error inserting data:', err);
//                     return res.status(500).json({ error: 'Failed to Get Devices' });
//                 }
//                 return res.status(200).json({ message: 'Success', "devices": devices });
//             });
//         }

//     });

// });

// app.get('/api/devices', (req, res) => {

//     console.log(req.params);
//     const { user_id } = req.body; // Destructure the body


//     const sql = `SELECT * FROM devices WHERE user_id = '${user_id}'`;


//     db.execute(sql, [user_id], (err, devices) => {
//         if (err) {
//             console.error('Error get data:', err);
//             return res.status(500).json({ error: 'Failed to get devices.' });
//         }
//         console.log(devices);

//         if (devices) {
//             console.log("Device Loaded Successfuly!");
//             return res.status(200).json(devices);
//         }

//     });

// });

// app.post('/api/device', (req, res) => {
//     const { user_id, mac, label, model, password } = req.body; // Destructure the body
//     let outputs, inputs = "";


//     if (model.toLowerCase() == 'g88-t') {
//         outputs = '0,0,0,0,0,0,0,0';
//         inputs = '0,0,0,0,0,0,0,0';
//     } else if (model.toLowerCase() == 'g44-t') {
//         outputs = '0,0,0,0';
//         inputs = '0,0,0,0';
//     }

//     const sql = `INSERT INTO devices (user_id,mac , model,outputs,inputs,label,password) VALUES (${user_id} ,'${mac}' ,'${model}','${outputs}', '${inputs}', '${label}' , ${password})`;

//     const data = {
//         "mac": mac,
//         "label": label,
//         "model": model,
//         "outputs": outputs,
//         "inputs": inputs
//     };


//     db.execute(sql, [mac, label, model], (err, devices) => {
//         if (err) {
//             console.error('Error get data:', err);
//             if (err.code == 'ER_DUP_ENTRY') {
//                 console.log("Duplicated!");
//                 return res.status(500).json({ error: err.code });
//             }
//             return res.status(500).json({ error: 'Failed to get devices.' });
//         }
//         console.log(devices);

//         if (devices.serverStatus == 2) {
//             console.log("Device Loaded Successfuly!");
//             return res.status(200).json({ data });
//         }

//     });

// });

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