
const dropDownButton = document.getElementById("dropdown-button-room");

const bedroomBtn = document.getElementById("bedroom-btn");
const livingRoomBtn = document.getElementById("living-room-btn");

const lightContainer = document.getElementById("light-container");
const roomStatus = document.getElementById("status");
const roomMode = document.getElementById("mode");
const statusContainer = document.getElementById("status-container");

const ledStateButton = document.getElementById("led-state-button");

const ledControlPanel = document.getElementById("Led-control-panel");
let currentRoom = null;

const ledStates = {
    "bedroom": {
        state: "off",
        mode: 1
    },
    "livingroom": {
        state: "off",
        mode: 1
    }
};

bedroomBtn.addEventListener("click", () => {
    if (currentRoom === "bedroom") {
        dropDownButton.textContent = "Room";
        ledControlPanel.style.display = "none";
        resetView();
        clearButtonContainer();
    } else {
        currentRoom = "bedroom";
        dropDownButton.textContent = "Bedroom";
        ledControlPanel.style.display = "flex";
        updateStatus(currentRoom);
        updateToggleStateButton();
        bedroomBtn.style.backgroundColor = "#b2dfdb";
        livingRoomBtn.style.backgroundColor = "#fff";
        lightContainer.style.display = "block";
        statusContainer.style.display = "block";

        clearButtonContainer();
    }
});

livingRoomBtn.addEventListener("click", () => {
    if (currentRoom === "livingroom") {
        dropDownButton.textContent = "Room";
        ledControlPanel.style.display = "none";
        resetView();
        clearButtonContainer();
    } else {
        currentRoom = "livingroom";
        dropDownButton.textContent = "Livingroom";
        ledControlPanel.style.display = "flex";
        updateStatus(currentRoom);
        updateToggleStateButton();
        livingRoomBtn.style.backgroundColor = "#b2dfdb";
        bedroomBtn.style.backgroundColor = "#fff";
        lightContainer.style.display = "block";
        statusContainer.style.display = "block";
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
        let lightStatus = i < mode ? "on" : "off";
        html += `<div class="light ${lightStatus}"></div>`;
    }
    lightContainer.innerHTML = html;
}

function updateStatus(room) {
    // toggleSwitch(LED);
    showImage(ledStates[currentRoom].mode);
    roomStatus.textContent = `${ledStates[room].state}`;
    roomMode.textContent = `Mode: ${ledStates[room].mode}`;
    if (ledStates[room].state == "on") showLights(ledStates[room].mode);
    else showLights(0);
}

function resetView() {
    lightContainer.style.display = "none";
    statusContainer.style.display = "none";
    bedroomBtn.style.backgroundColor = "#fff";
    livingRoomBtn.style.backgroundColor = "#fff";
    currentRoom = null;
}

function toggleState() {
    if (ledStates[currentRoom]) {
        if (ledStates[currentRoom].state == "on" & !ledStateButton.classList.contains('active')) {
            ledStates[currentRoom].state = "off";
        }
        else if (ledStates[currentRoom].state == "off" & ledStateButton.classList.contains("active")) {
            ledStates[currentRoom].state = "on";
        }
        updateStatus(currentRoom);
        sendCommand(currentRoom, "state", ledStates[currentRoom].state);
    }
}

function toggleMode(mode) {
    let modeValue;

    switch (mode) {
        case "mode1":
            modeValue = 1;
            break;
        case "mode2":
            modeValue = 2;
            break;
        case "mode3":
            modeValue = 3;
            break;
        default:
            console.error("Invalid mode:", mode);
            return;
    }
    const toggleButton = document.getElementById('led-state-button');
    if (toggleButton.classList.contains('active')) {
        // Toggle button is active, show corresponding image for mode
        if (ledStates[currentRoom]) {
            ledStates[currentRoom].mode = modeValue;
            updateStatus(currentRoom);
            sendCommand(currentRoom, "mode", modeValue);
            showImage(modeValue); 
        } else {
            console.error("Invalid room:", currentRoom);
        }
    } else {
        // Toggle button is not active, show image off
        showImage('off');
    }

}

function showImage(mode) {
    const img1 = document.querySelector('#image1');
    const img2 = document.querySelector('#image2');
    const img3 = document.querySelector('#image3');
    const imgOn = document.querySelector('#imageon');
    const imgOff = document.querySelector('#imageoff');

    // Hide all images
    if (img1) img1.classList.add('hidden');
    if (img2) img2.classList.add('hidden');
    if (img3) img3.classList.add('hidden');
    if (imgOn) imgOn.classList.add('hidden');
    if (imgOff) imgOff.classList.add('hidden');

    if (ledStates[currentRoom].state === 'on' && imgOn)
        {
            switch (mode) {
                case 1:
                    if (img1)
                        {
                            img1.classList.remove('hidden');
                            img1.classList.add('led-mode-image');
                        }
                    break;
                case 2:
                    if (img2)
                        {
                            img2.classList.remove('hidden');
                            img2.classList.add('led-mode-image');
                        }
                    break;
                case 3:
                    if (img3)
                        {
                            img3.classList.remove('hidden');
                            img3.classList.add('led-mode-image');
                        }
                    break;
                default:
                    console.error(`Image for mode ${mode} not found!`);
                    break;
            }
        }
    else if (ledStates[currentRoom].state === 'off' && imgOff)
        {
            imgOff.classList.remove('hidden');
            imgOff.classList.add('led-control-image');
        }
    // Show the selected image based on mode
    // if (ledStates[currentRoom].state === 'on' && imgOn) {
    //     imgOn.classList.remove('hidden');
    //     imgOn.classList.add('led-control-image')
    // } else if (mode === 1 && img1) {
    //     img1.classList.remove('hidden');
    //     img1.classList.add('led-mode-image')
    // } else if (mode === 2 && img2) {
    //     img2.classList.remove('hidden');
    //     img2.classList.add('led-mode-image')
    // } else if (mode === 3 && img3) {
    //     img3.classList.remove('hidden');
    //     img3.classList.add('led-mode-image')
    // } else if (ledStates[currentRoom].state === 'off' && imgOff) {
        // imgOff.classList.remove('hidden');
        // imgOff.classList.add('led-control-image')
    // } else {
    //     console.error(`Image for mode ${mode} not found!`);
    // }
}

function toggleStatButton(toggle) {

    ledControlPanel.classList.toggle('active');
    ledStateButton.classList.toggle('active');
    const device1 = toggle.closest('.devices');
    device1.classList.toggle('active');
    toggleState();

    const toggleButton = document.getElementById('led-state-button');
    if (toggleButton.classList.contains('active')) {
        showImage('on');
    } else {
        showImage('off');
    }
}


// edited
function updateToggleStateButton() {
    const ledPanel = ledControlPanel.classList;
    const toggleButton = ledStateButton.classList;
    const img1 = document.querySelector('#image1');
    const img2 = document.querySelector('#image2');
    const img3 = document.querySelector('#image3');
    const imgOn = document.querySelector('#imageon');
    const imgOff = document.querySelector('#imageoff');

    // Hide all images
    if (img1) img1.classList.add('hidden');
    if (img2) img2.classList.add('hidden');
    if (img3) img3.classList.add('hidden');
    if (imgOn) imgOn.classList.add('hidden');
    if (imgOff) imgOff.classList.add('hidden');
    switch (ledStates[currentRoom].state) {
        case "on":
            if (!ledPanel.contains('active')) {
                ledPanel.add('active');
            }
            if (!toggleButton.contains('active')) toggleButton.add('active');
            imgOn.classList.remove('hidden');
            imgOn.classList.add('led-control-image')
            break;
        case "off":
            if (ledPanel.contains('active')) ledPanel.remove('active');
            if (toggleButton.contains('active')) toggleButton.remove('active');
            imgOff.classList.remove('hidden');
            imgOff.classList.add('led-control-image')
            break;
    }
}
function sendCommand(room, commandType, value) {
    const message = `${room} ${commandType} ${value}`;
    sendMQTTMessage(message,led_topic);
}
