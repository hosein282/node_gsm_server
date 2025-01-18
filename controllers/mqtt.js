
const MqttHelper = require('../modules/mqttHelper'); // Adjust the path as needed
const config = require('../modules/constants.js');
const db = require('../repository/database');
const bodyParser = require('body-parser');
const nodecipher = require('node-cipher');

const mqttBrokerUrl = 'mqtt://broker.emqx.io:1883';


const mqttClient = new MqttHelper(mqttBrokerUrl);
async function startMqtt() {

    try {
        await mqttClient.connect();

        await mqttClient.subscribe(config.server_topic);
        // await mqttClient.subscribe(config.report_topic);
        console.log(mqttBrokerUrl);
        // Handler for incoming messages
        mqttClient.onMessage((topic, message) => {
            console.log(`Received message on topic ${topic}`);
            console.log(`Message type: ${typeof message}`);
            console.log(`message[0]: ${message[0]}`);
            var data;

            if (message[0] == 123) {
                try {
                    data = JSON.parse(message);
                }
                catch (e) {
                    console.log(e);
                    return;

                }
            } else {
                try {
                    data = base64ToObject(`"${message}"`);
                } catch (e) {
                    console.log(e);
                    return;
                }
            }

            handleMqttReport(data);
            // report by device
            if (topic === config.server_topic) {

                // do action 
            } else if (topic === config.report_topic) {
                // handleMqttMessage(data);
            }
        });

    } catch (error) {
        console.error('Error in MQTT operation:', error);
    }

    // Cleanup / disconnect the client when needed
    // Uncomment to disconnect after 10 seconds for cleanup
    // setTimeout(async () => {
    //     await mqttClient.disconnect();
    // }, 10000);

}

// Function to convert any object to base64
function objectToBase64(obj) {
    // Convert the object to a JSON string
    const jsonString = JSON.stringify(obj);

    // Encode the JSON string to base64
    const base64String = Buffer.from(jsonString).toString('base64');

    return base64String;
}

function base64ToObject(base64String) {
    // Decode the base64 string to JSON
    console.log(`base64String: ${base64String}`);
    const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
    console.log(`jsonString: ${jsonString}`);

    // Parse the JSON string to an object
    const obj = JSON.parse(jsonString);

    return obj;
}
function handleMqttReport(message) {

    const { event, operator, temperature, mac, settingList, outStates, inStates, connected, signal } = message;

    if (event === 'report') {
        let data = {};
        if (operator != null) {
            data['operator'] = `'${operator}'`;
        }
        if (temperature != null) {
            data['temperature'] = Number(temperature);
        }
        if (signal != null) {
            data['signalQ'] = Number(signal);
        }
        if (settingList != null) {
            data['setting'] = `'${settingList}'`;
        }
        if (outStates != null) {
            data['outStates'] = `'${outStates}'`;
        }
        if (inStates != null) {
            data['inStates'] = `'${inStates}'`;
        }
        if (connected != null) {
            data['connected'] = connected;
        }

        db.update('devices', data, { mac }).then((result) => {
            if (result) {
                const topic = "sub" + ">" + mac;
                mqttClient.publish(topic, JSON.stringify(message));
                console.log("updated!");

            } else {
                console.log("not updated!");
            }
        });


    } else if (event === 'feedback') {

        let data = prepareData(message);
        if (data['update'] === false) {
            const topic = "sub" + ">" + mac;
            mqttClient.publish(topic, JSON.stringify(message));
            return;
        }
        db.update('devices', data, { mac }).then((result) => {
            if (result) {
                const topic = "sub" + ">" + mac;
                mqttClient.publish(topic, JSON.stringify(message));
                console.log("updated!");

            } else {
                console.log("not updated!");
            }
        });

    } else if (event === 'io') {
        handleMqttMessage(message);
    } else if (event === 'timer') {
        handleMqttMessage(message);

    } else if (event === 'status') {
        getStatusFromDb(message);
    } else if (event === 'update') {
        handleMqttMessage(message);

    }
    console.log(mac);
}


function prepareData(message) {
    const { event, operator, temperature, mac, settingList, outStates, inStates, connected, signal, update } = message;

    let data = {};
    if (operator != null) {
        data['operator'] = `'${operator}'`;
    }

    if (temperature != null) {
        data['temperature'] = Number(temperature);
    }

    if (update != null) {
        data['update'] = update;
    }

    if (signal != null) {
        data['signalQ'] = Number(signal);
    }
    if (settingList != null) {
        data['setting'] = `'${settingList}'`;
    }
    if (outStates != null) {
        data['outStates'] = `'${outStates}'`;
    }
    if (inStates != null) {
        data['inStates'] = `'${inStates}'`;
    }
    if (connected != null) {
        data['connected'] = connected;
    }
    return data;
}
function handleMqttMessage(message) {

    const { mac, out, state, event, timer, label, url, version, result } = message; // Destructure the body
    if (mac != "" && mac != undefined) {
        const topic = "action" + ">" + mac;
        const data = { 'mac': mac };
        if (out !== undefined) data.out = out;
        if (state !== undefined) data.state = state;
        if (event !== undefined) data.event = event;
        if (timer !== undefined) data.timer = timer;
        if (label !== undefined) data.label = label;
        if (result !== undefined) data.result = result;
        if (url !== undefined) data.url = url;
        if (version !== undefined) data.version = version;
        console.log(data);

        mqttClient.publish(topic, objectToBase64(data));
    } else {
        console.log("receiver device mac is not initialized!");
    }

}

function getStatusFromDb(message) {
    const { mac, event } = message; // Destructure the body

    if (mac != "" && mac != undefined) {
        const topic = "sub" + ">" + mac;
        db.read('devices', [], { 'mac': mac }).then((result) => {
            if (result) {
                result[0]['event'] = 'status';
                const str = JSON.parse(JSON.stringify(result[0])).label;
                console.log(str);

                console.log(JSON.stringify(result[0]));
                mqttClient.publish(topic, JSON.stringify(result[0]));

            }
        });


    } else {
        console.log("receiver device mac is not initialized!");
    }
}

module.exports = {
    startMqtt
}