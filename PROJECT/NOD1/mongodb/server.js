const mqtt = require('mqtt');
const {MongoClient} = require('mongodb');
const mongoose = require('mongoose');
const moment = require('moment');
const shortId = require('shortid');
const Events = require('./event');
const topic = "smarthome/sensor";

const client = mqtt.connect('mqtts://c0116143ef0143149b4c43981ffead03.s1.eu.hivemq.cloud', 
{ 
  username: 'CE232',
  password: 'Nhi09032003'
});

mongoose.connection.on('connected', async () => {
    console.log('MongoDb connected');
});

mongoose.connection.on('error', async (err) => {
    console.log('Error connecting MongoDb', err);
});

client.on('connect', async () => {
    await mongoose.connect('mongodb+srv://21522426:Nhi09032003@cluster0.nytchg8.mongodb.net/?retryWrites=true&w=majority');

    console.log('MQTT Connected');
    client.subscribe(topic);

})

client.on('message', async (topic, message) => {
    console.log('MQTT received Topic:', topic.toString() ,', Message: ', message.toString());

    let data = message.toString();
    data = JSON.parse(data);
    data.created = moment().utc().add(5, 'hours');
    data._id = shortId.generate();
    await saveData(data);

}) 

saveData = async (data) => {
  data = new Events(data);
  data = await data.save();
  console.log('Saved data:', data);
}