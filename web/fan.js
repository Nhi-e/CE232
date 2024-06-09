    var broker = "aadd81fb96c3478d9cf64cf7a57edd8e.s1.eu.hivemq.cloud";
    var port = 8884;
    var path = "/mqtt";
    var clientID = "clientID-" + new Date().getTime();
    var client = new Paho.MQTT.Client(broker, Number(port), path, clientID);
    var user_mqtt = "CE232";
    var pass_mqtt = "Thanh0512";
    topic1 = "smarthome/fan/control";
    topic2 = "smarthome/fan/time";

    // Connect();
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({
        onSuccess: onConnect,
        useSSL: true,
        userName: user_mqtt,
        password: pass_mqtt,
    });
    function onConnect() {
        console.log("Connected");
        client.subscribe(topic1);
        console.log("Subscribed " + topic1);
        client.subscribe(topic2);
        console.log("Subscribed " + topic2);
    }
    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
    }
    function onMessageArrived(message) {
        console.log("Message Arrived: " + message.payloadString);
    }

    const slider = document.getElementById('range');
    const sliderValue = document.getElementById('slider-value');
    const innerSpinner = document.querySelector('.inner-spinner');
    const outerSpinner = document.querySelector('.outer-spinner');

    slider.addEventListener('input', function () {
        const value = this.value;
        sliderValue.textContent = value;

        var message = new Paho.MQTT.Message(value);
        message.destinationName = "smarthome/fan/control";
        message.qos = 0;
        client.send(message);

        const percentage = (value - this.min) / (this.max - this.min) * 100;
        this.style.background = `linear-gradient(to right, #2196F3 0%, #2196F3 ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
        let rotationSpeed;
        if (value == 0) {
            rotationSpeed = 0; // Không quay khi giá trị là 0
        } else {
            rotationSpeed = 2 - (value / 100) * 2.5; // Tốc độ xoay từ 2s đến 0.5s
        }
        innerSpinner.style.animationDuration = rotationSpeed;
        outerSpinner.style.animationDuration = rotationSpeed;
    });
    slider.dispatchEvent(new Event('input'));

    const hourInput = document.getElementById('hour-input');
    const minuteInput = document.getElementById('minute-input');
    const secondInput = document.getElementById('second-input');
    const hourDurationInput = document.getElementById('hour-duration');
    const minuteDurationInput = document.getElementById('minute-duration');
    const secondDurationInput = document.getElementById('second-duration');
    const speedInput = document.getElementById('speed-input');
    const setTimerButton = document.getElementById('set-timer');

    setTimerButton.addEventListener('click', function () {
        const hours = parseInt(hourInput.value);
        const minutes = parseInt(minuteInput.value);
        const seconds = parseInt(secondInput.value);

        const hourDuration = parseInt(hourDurationInput.value);
        const minuteDuration = parseInt(minuteDurationInput.value);
        const secondDuration = parseInt(secondDurationInput.value);

        const speed = speedInput.value;

        const totalMilliseconds = (hourDuration * 3600 + minuteDuration * 60 + secondDuration) * 1000;

        const formattedTime = [
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0')
        ].join(':');

        const formattedDuration = [
            String(hourDuration).padStart(2, '0'),
            String(minuteDuration).padStart(2, '0'),
            String(secondDuration).padStart(2, '0')
        ].join(':');

        const timeformat = `${formattedTime} ${formattedDuration} ${speed}`;
        var message1 = new Paho.MQTT.Message(timeformat);
        message1.destinationName = "smarthome/fan/time";
        message1.qos = 0;
        client.send(message1);
    });

