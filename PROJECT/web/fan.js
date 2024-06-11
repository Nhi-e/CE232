    const slider = document.getElementById('range');
    const sliderValue = document.getElementById('slider-value');
    const innerSpinner = document.querySelector('.inner-spinner');
    const outerSpinner = document.querySelector('.outer-spinner');

    slider.addEventListener('input', function () {
        const value = this.value;
        sliderValue.textContent = value;
    
        sendMQTTMessage(value, `${fan_topic}/control`);
    
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
        sendMQTTMessage(timeformat, `${fan_topic}/time`);
    });
    function showFanControlPanel() {
        var fanControlPanel = document.getElementById('Show-panel');
        if (fanControlPanel.style.display === 'none' || fanControlPanel.style.display === '') {
            fanControlPanel.style.display = 'block';
        } else {
            fanControlPanel.style.display = 'none';
        }
    }

