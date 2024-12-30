
const MqttHelper = require('../modules/mqttHelper'); // Adjust the path as needed
const config = require('../modules/constants.js');
const db = require('../repository/database');
const bodyParser = require('body-parser');

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
            console.log(`Received message on topic ${topic}: ${message}`);
            const data = JSON.parse(message);
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


function handleMqttReport(message) {

    const { event, operator, temperature, mac, settingList, outStates, inStates, connected } = message;

    if (event === 'report') {
        let data = {};
        if (operator != null) {
            data['operator'] = `'${operator}'`;
        }
        if (temperature != null) {
            data['temperature'] = Number(temperature);
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
        const topic = "sub" + ">" + mac;
        mqttClient.publish(topic, JSON.stringify(message));
    } else if (event === 'io') {
        handleMqttMessage(message);
    } else if (event === 'timer') {
        handleMqttMessage(message);

    } else if (event === 'status') {
        getStatusFromDb(message);
    }else if(event === 'update'){
        handleMqttMessage(message);

    }
    console.log(mac);
}
function handleMqttMessage(message) {

    const { mac, out, state, event, timer, label } = message; // Destructure the body
    if (mac != "" && mac != undefined) {
        const topic = "action" + ">" + mac;
        const data = { 'out': out, 'state': state, 'event': event, 'timer': timer, 'label': label };
        console.log(data);

        mqttClient.publish(topic, JSON.stringify(data));
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