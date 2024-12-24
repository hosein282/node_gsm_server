const mqtt = require('mqtt');
// Update with your MQTT broker URL

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`; // Uniquely identify the client

class MqttHelper {



    connect() {
        return new Promise((resolve, reject) => {
            this.client = mqtt.connect('mqtt://broker.emqx.io:1883', {
                clientId
            });

            this.client.on('connect', () => {

                console.log('Connected to MQTT broker');
                startMqtt();

                resolve();
            });

            this.client.on('error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });

    }

    subscribe(topic, options = {}) {
        return new Promise((resolve, reject) => {
            this.client.subscribe(topic, options, (err) => {
                if (err) {
                    console.error('Error subscribing to topic:', err);
                    return reject(err);
                }
                console.log(`Subscribed to topic: ${topic}`);
                resolve();
            });
        });
    }

    publish(topic, message, options = {}) {
        return new Promise((resolve, reject) => {
            this.client.publish(topic, message, { qos: 0, ...options }, (err) => {
                if (err) {
                    console.error('Error publishing message:', err);
                    return reject(err);
                }
                console.log(`Message published to ${topic}: ${message}`);
                resolve();
            });
        });
    }

    onMessage(callback) {
        this.client.on('message', (topic, message) => {
            callback(topic, message);
        });
    }

    disconnect() {
        return new Promise((resolve) => {
            this.client.end(() => {
                console.log('Disconnected from MQTT broker');
                resolve();
            });
        });
    }


    async startMqtt() {

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


    handleMqttReport(message) {

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
    handleMqttMessage(message) {

        const { mac, out, state, event } = message; // Destructure the body
        if (mac != "" && mac != undefined) {

            const topic = "action" + ">" + mac;
            const data = { 'out': out, 'state': state, 'event': event };
            mqttClient.publish(topic, JSON.stringify(data));
        } else {
            console.log("receiver device is not initialized!");
        }

    }



}

module.exports = MqttHelper; // Export the MqttHelper class


