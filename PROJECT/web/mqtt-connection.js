var client;

const PORT = 8884
const path = "/mqtt"
const BROKER_URL = "c0116143ef0143149b4c43981ffead03.s1.eu.hivemq.cloud";
const userName = "CE232"
const passWord = "Nhi09032003"
const clientID = "clientID-" + new Date().getTime();

const led_topic = "smarthome/led"
const door_topic = "smarthome/door"
const fan_topic = "smarthome/fan"
const sensor_topic = "smarthome/sensor"
var temperatureChart = null;
var humidityChart = null;

var Temperature = "0";
var Humidity = "0";
var temperatureData = [];
var temperatureLabels = [];

var humidityData = [];
var humidityLabels = [];

var tempBuffer = [];
var tempBufferTimes = [];
var humBuffer = [];
var humBufferTimes = [];


function connectMQTT() {
    client = new Paho.MQTT.Client(BROKER_URL, PORT, path, clientID);

    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({
        onSuccess: onConnect,
        userName: "CE232",
        password: "Nhi09032003",
        useSSL: true
    });

    function onConnect() {
        console.log("Đã kết nối đến MQTT broker");
        client.subscribe("smarthome/sensor");
        client.subscribe("smarthome/fan");
        temperatureChart = createTemperatureChart();
        humidityChart = createHumidityChart();
        setInterval(updateTemperatureChart, 60000);
        setInterval(updateHumidityChart, 60000);

    }

    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
    }

    function onMessageArrived(message) {
        onMessageSensorArrived(message);
        checkjson = true;
    }
}

function sendMQTTMessage(message, topic) {
    if (client && client.isConnected()) {
        var mqttMessage = new Paho.MQTT.Message(message);
        mqttMessage.destinationName = topic;
        client.send(mqttMessage);
    }
}
