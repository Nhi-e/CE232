const doorStates = {
    state: "close"
}

function updateDoorState() {
    const toggle = document.getElementById("door-state-button").classList;
    if (toggle.contains('active')) {
        doorStates.state = 'open';
    } else {
        doorStates.state = 'close';
    }
    sendMQTTMessage(`${doorStates.state}`, door_topic);
}

window.onload = connectMQTT;