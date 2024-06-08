
const dropDownButton = document.getElementById("dropdown-button-room");

const bedroomBtn = document.getElementById("bedroom-btn");
const livingRoomBtn = document.getElementById("living-room-btn");

const lightContainer = document.getElementById("light-container");
const roomStatus = document.getElementById("status");
const roomMode = document.getElementById("mode");
const statusContainer = document.getElementById("status-container");

const ledStateButton = document.getElementById("led-state-button");
let currentRoom = null;

var bedroomLedMode = 1;
var bedroomLedState = "off";

var livingroomLedMode = 1;
var livingroomLedState = "off";
// var client;

// function connectMQTT() {
//     client = new Paho.MQTT.Client("4a3b0ae555444c35bb88f1b5da956f24.s1.eu.hivemq.cloud", 8884, "/mqtt", "clientId");

//     client.onConnectionLost = onConnectionLost;
//     client.onMessageArrived = onMessageArrived;

//     client.connect({
//         onSuccess: onConnect,
//         userName: "CE232",
//         password: "Binheo12",
//         useSSL: true
//     });

//     function onConnect() {
//         console.log("Đã kết nối đến MQTT broker");
//     }

//     function onConnectionLost(responseObject) {
//         if (responseObject.errorCode !== 0) {
//             console.log("onConnectionLost:" + responseObject.errorMessage);
//         }
//     }

//     function onMessageArrived(message) {
//         alert("onMessageArrived:" + message.payloadString);
//     }
// }

// function sendMQTTMessage(message) {
//     if (client && client.isConnected()) {
//         var mqttMessage = new Paho.MQTT.Message(message);
//         mqttMessage.destinationName = "smarthome/led";
//         client.send(mqttMessage);
//     }
// }
// window.onload = connectMQTT;

bedroomBtn.addEventListener("click", () => {
    if (currentRoom === "Bedroom") {
        dropDownButton.textContent = "LED"
        resetView();
        clearButtonContainer();

    } else {
        dropDownButton.textContent = "Bedroom";
        updateStatus("Bedroom", bedroomLedState, bedroomLedMode);
        bedroomBtn.style.backgroundColor = "#b2dfdb";
        livingRoomBtn.style.backgroundColor = "#fff";
        lightContainer.style.display = "block";
        statusContainer.style.display = "block";
        currentRoom = "Bedroom";

        clearButtonContainer();
    }
});

livingRoomBtn.addEventListener("click", () => {
    if (currentRoom === "Living Room") {
        dropDownButton.textContent = "LED"
        resetView();
        clearButtonContainer();
    } else {
        dropDownButton.textContent = "Livingroom"
        updateStatus("Living Room", livingroomLedState, livingroomLedMode);
        livingRoomBtn.style.backgroundColor = "#b2dfdb";
        bedroomBtn.style.backgroundColor = "#fff";
        lightContainer.style.display = "block";
        statusContainer.style.display = "block";
        currentRoom = "Living Room";

        clearButtonContainer();
    }
});

function clearButtonContainer() {
    const buttonContainer = document.querySelector("#button-container");
    buttonContainer.innerHTML = "";
}

function showLights(mode) {
    let html = "";
    for (let i = 0; i < 3; i++) {
        let lightStatus = i >= mode - 1 ? "on" : "off";
        html += `<div class="light ${lightStatus}"></div>`;
    }
    lightContainer.innerHTML = html;
}

function updateStatus(room, status, mode) {
    roomStatus.textContent = `Status: ${status}`;
    roomMode.textContent = `Mode: ${mode}`;
    if (status == "on") showLights(mode);
    else showLights(4);
}

function resetView() {
    lightContainer.style.display = "none";
    statusContainer.style.display = "none";
    bedroomBtn.style.backgroundColor = "#fff";
    livingRoomBtn.style.backgroundColor = "#fff";
    currentRoom = null;
}

function toggleLight(room) {
    let state = null;
    switch (room) {
        case "bedroom":
            if (bedroomLedState == "on") bedroomLedState = "off";
            else bedroomLedState = "on";
            updateStatus("bedroom", bedroomLedState, bedroomLedMode)
            state = bedroomLedState;
            break;
        case "livingroom":
            if (livingroomLedState == "on") livingroomLedState = "off";
            else livingroomLedState = "on";
            updateStatus("bedroom", livingroomLedState, livingroomLedMode)
            state = livingroomLedState;
            break;

        default:
            break;
    }
    sendCommand(room, "state", state);
}

function toggleMode(room) {
    let mode = null;
    switch (room) {
        case "bedroom":
            bedroomLedMode = (bedroomLedMode + 1);
            if (bedroomLedMode == 4) bedroomLedMode = 1;
            updateStatus("bedroom", bedroomLedState, bedroomLedMode)
            mode = bedroomLedMode;
            break;

        case "livingroom":
            livingroomLedMode = (livingroomLedMode + 1);
            if (livingroomLedMode == 4) livingroomLedMode = 1;
            updateStatus("bedroom", livingroomLedState, livingroomLedMode)
            mode = livingroomLedMode;
            break;
        default:
            break;
    }
    sendCommand(room, "mode", mode);
}

function sendCommand(room, commandType, value) {
    const message = `${room} ${commandType} ${value}`;
    sendMQTTMessage(ledTopic, message);
}