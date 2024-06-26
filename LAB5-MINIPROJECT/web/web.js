
    var CheckMK = false;
    var checkjson = false;
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
    
    var user_mqtt = "CE232";
    var pass_mqtt = "Nhi09032003";
    topicsub = "smarthome/sensor"
    var broker = "c0116143ef0143149b4c43981ffead03.s1.eu.hivemq.cloud"; // Địa chỉ của MQTT broker
    // Kết nối bằng web socket
    var port = 8884; // Cổng của MQTT broker.
    var path = "/mqtt"; 
    var clientID = "clientId-" + new Date().getTime();
    var mqttClient = new Paho.MQTT.Client(broker, Number(8884), path, clientID);

    
    mqttClient.onMessageArrived = MessageArrived;
    mqttClient.onConnectionLost = ConnectionLost;
    Connect();

    setInterval(updateTemperatureChart, 60000);
    setInterval(updateHumidityChart, 60000);

    function Connect(){
      mqttClient.connect({
      useSSL: true,
      userName: user_mqtt,
      password: pass_mqtt,
      onSuccess: Connected,
      onFailure: ConnectionFailed,
      keepAliveInterval: 10,
      });
    }
    function Connected() {
      console.log("Connected to broker");
      mqttClient.subscribe("smarthome/sensor");
    }
    
    function ConnectionFailed(res) {
      console.log("Connect failed:" + res.errorMessage);
    }
    
    function ConnectionLost(res) {
      if (res.errorCode !== 0) {
        console.log("Connection lost:" + res.errorMessage);
        Connect();
      }
    }
    function getDateTime() {
      var currentdate = new Date();
      var datetime = currentdate.getDate() + "/"
      + (currentdate.getMonth()+1) + "/"
      + currentdate.getFullYear() + " at "
      + currentdate.getHours() + ":"
      + currentdate.getMinutes() + ":"
      + currentdate.getSeconds();
      return datetime;
    } 
    function getDateHour() {
      var currentdate = new Date();
      var datetime = (currentdate.getHours()) + ":" + currentdate.getMinutes()
      return datetime;
    } 
    
    function MessageArrived(message){
      console.log("Data ESP:" + message.payloadString);
      StringCheck(message.payloadString);
	
      if(checkjson)
      {     
        var DataJson = JSON.parse(message.payloadString); 
        ND =  DataJson.Temperature;
        DA = DataJson.Humidity;
        document.getElementById("Temperature").innerHTML = ND;
        document.getElementById("Humidity").innerHTML = DA;
        document.getElementById("timetemp").innerHTML = getDateTime();
        document.getElementById("timehum").innerHTML = getDateTime();
        tempBuffer.push(ND);
        tempBufferTimes.push(getDateHour());
        humBuffer.push(DA);
        humBufferTimes.push(getDateHour());
      }
      else 
      {
        console.log("JSON Error!!!");
      }
    }

    function StringCheck(mess)
		{
			try
			{
				JSON.parse(mess);
			} 
			catch (e)
			{
				checkjson = false;
				return false;
			}
				checkjson = true;
				return true;
		}
    function createTemperatureChart() {
      var ctx = document.getElementById('temperatureChart').getContext('2d');
      return new Chart(ctx, {
          type: 'line',
          data: {
              labels: temperatureLabels,
              datasets: [{
                  label: '',
                  data: temperatureData,
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              scales: {
                  y: {
                      beginAtZero: true
                  }
              },
              plugins: {
                  legend: {
                      display: false
                  }
              }
          }
      });
  }
  
  // Function to create humidity chart
  function createHumidityChart() {
      var ctx = document.getElementById('humidityChart').getContext('2d');
      return new Chart(ctx, {
          type: 'line',
          data: {
              labels: humidityLabels,
              datasets: [{
                  label: '',
                  data: humidityData,
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              scales: {
                  y: {
                      beginAtZero: true
                  }
              },
              plugins: {
                  legend: {
                      display: false
                  }
              }
          }
      });
  }
  
  // Create charts
    var temperatureChart = null;
    var humidityChart = null;
  
    window.onload = function() {
      temperatureChart = createTemperatureChart();
      humidityChart = createHumidityChart();
  }
  
  // Function to update the temperature chart
    function updateTemperatureChart() {
    if (tempBuffer.length > 0) {
        var averageTemp = tempBuffer[tempBuffer.length - 1];
        var currentTime = tempBufferTimes[tempBufferTimes.length - 1];

        temperatureData.push(averageTemp);
        temperatureLabels.push(currentTime);

        if (temperatureData.length > 8) {
            temperatureData.shift();
            temperatureLabels.shift();
        }

        if (temperatureChart) {
            temperatureChart.update();
        }

        tempBuffer = [];
        tempBufferTimes = [];
    }
}
    function updateHumidityChart() {
    if (humBuffer.length > 0) {
        var averageHum = humBuffer[humBuffer.length - 1];
        var currentTime = humBufferTimes[humBufferTimes.length - 1];

        humidityData.push(averageHum);
        humidityLabels.push(currentTime);
    
        if (humidityData.length > 8) {
            humidityData.shift();
            humidityLabels.shift();
        }
    
        if (humidityChart) {
            humidityChart.update();
        }
        humBuffer = [];
        humBufferTimes = [];
    }
}
    function toggleSwitch(toggle) {
        const device = toggle.closest('.devices');
        toggle.classList.toggle('active');
        device.classList.toggle('active');
        const statusElement = toggle.querySelector('.device-text');
        if (statusElement.textContent === 'OFF') {
        statusElement.textContent = 'ON';
        } else {
        statusElement.textContent = 'OFF';
        }
    }
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });
    