
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

setInterval(updateTemperatureChart, 60000);
setInterval(updateHumidityChart, 60000);


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
  
  function onMessageSensorArrived(message){
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
    function toggleStateDevice(id) {
        switch (id) {
            case 'DOOR':
                updateDoorState();
                break;
        }
    }
    var temperatureChart = null;
    var humidityChart = null;

    window.onload = function() {
        temperatureChart = createTemperatureChart();
        humidityChart = createHumidityChart();
    }
    // edited
    function toggleSwitch(toggle, id) {
        const device = toggle.closest('.devices');
        const statusElement = device.querySelector('.device-title');
        toggle.classList.toggle('active');
        device.classList.toggle('active');
        if (statusElement.textContent === 'OFF') {
            statusElement.textContent = "ON";
        } else {
            statusElement.textContent = 'OFF';
        }
        toggleStateDevice(id);
    }
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    const username = document.getElementById('signUpUsername').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const signUpMessage = document.getElementById('signUpMessage');
    const signInMessage = document.getElementById('signInMessage');

    
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });
    /*kiểm tra tên người dùng có trong local storage không?*/
    document.addEventListener('DOMContentLoaded', (event) => {
        const usernameDisplay = document.getElementById('usernameDisplay');
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            usernameDisplay.textContent = storedUsername;
        }
    });
    signUpForm.addEventListener('submit', (e) => {
        e.preventDefault();
    
        const username = document.getElementById('signUpUsername').value;
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
    
        // Kiểm tra xem email đã được đăng ký chưa
        const storedEmail = localStorage.getItem('email');
        if (!username || !email || !password) {
            signUpMessage.textContent = 'Please complete all information!';
            signUpMessage.style.color = 'red';
            return;
        }
        
        if (email === storedEmail) {
            // Email đã tồn tại
            signUpMessage.textContent = 'Email already exists. Try again or click Sign In';
            signUpMessage.style.color = 'red';
        } else {
            // Thu thập dữ liệu từ form và lưu trữ vào localStorage
            localStorage.setItem('username', username);
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
            
    
            // Hiển thị thông báo đăng ký thành công
            signUpMessage.textContent = 'Sign Up Successful!';
            signUpMessage.style.color = 'green';
    
            // Chuyển sang form Sign In sau 2 giây
            setTimeout(() => {
                container.classList.remove('right-panel-active');
                signUpMessage.textContent = ''; // Xóa thông báo sau khi chuyển form
            }, 1000);
        }
    });
    signInForm.addEventListener('submit', (e) => {
        e.preventDefault();
    
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
    
        // Lấy dữ liệu từ localStorage (có thể thay bằng kiểm tra từ server)
        const storedEmail = localStorage.getItem('email');
        const storedPassword = localStorage.getItem('password');
        if (email !== storedEmail) {
            signInMessage.textContent = 'Invalid Email. Try again or click Sign Up to continue.';
            signInMessage.style.color = 'red';
        }
        else if (password !== storedPassword) {
            signInMessage.textContent = 'Wrong password. Try again or click Forgot password to reset it.';
            signInMessage.style.color = 'red';
        }

        else if (email === storedEmail && password === storedPassword) {
            signInMessage.textContent = 'Sign In Successful!';
            signInMessage.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'http://127.0.0.1:5500/web/web.html';
            }, 500);
        }
    });
    /*localStorage.removeItem('email');
    localStorage.removeItem('password');*/
    document.addEventListener('DOMContentLoaded', (event) => {
        const username = localStorage.getItem('username');

    });
    function toggleDropdown() {
        const dropdownContent = document.getElementById("dropdown-content-room");
        dropdownContent.classList.toggle("show");
    }
    
    // Đóng dropdown nếu nhấp bên ngoài dropdown
    window.onclick = function (event) {
        if (!event.target.matches('.dropdown-button')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }
    

    