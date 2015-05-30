//------------------------------------------------------------------------------
// Copyright IBM Corp. 2015
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------

var mqtt = require('mqtt');
var properties = require('properties');
var arDrone = require('ar-drone'); 
var drone = arDrone.createClient(); 

properties.parse('./drone-config.properties', {path: true}, function(err, cfg) {
    if (err) {
      console.error('A file named done-config.properties containing the device registration from the IBM IoT Cloud is missing.');
      console.error('The file must contain the following properties: apikey, apitoken, authtoken, and deviceid.');
      throw e;
    }
    var org = cfg.apikey.split('-')[1];
    start(cfg.deviceid, cfg.apikey, cfg.authtoken, org + '.messaging.internetofthings.ibmcloud.com', 
        '1883');
  });

function start(deviceId, apiKey, apiToken, mqttHost, mqttPort) {
  var org = apiKey.split('-')[1];
  var clientId = ['d', org, 'parrot-ar', 'ryansdrone'].join(':');
  var client = mqtt.connect("mqtt://" + mqttHost + ":" + mqttPort, {
              "clientId" : clientId,
              "keepalive" : 30,
              "username" : "use-token-auth",
              "password" : apiToken
            });
  client.on('connect', function() {
    console.log('MQTT client connected to IBM IoT Cloud.');
    client.subscribe('iot-2/cmd/fly/fmt/json', {qos : 0}, function(err, granted) {
      if (err) throw err;
      console.log("subscribed");
    });
  });
  client.on('error', function(err) {
    console.error('client error ' + err);
    process.exit(1);
  });
  client.on('close', function() {
    console.log('client closed');
    process.exit(1);
  });

  client.on('message', function(topic, message, packet) {
   console.log(topic);
   var msg = JSON.parse(message.toString());
   if(msg.d.action === '#takeoff') {
     console.log('take off');
     drone.disableEmergency();
		 drone.takeoff();
   } else if(msg.d.action === '#land') {
     console.log('land');
     drone.stop();
	   drone.land();
   } else if(msg.d.action === '#takeoffandland') {
     console.log('take off and land');
     drone.disableEmergency();
		 drone.takeoff();
     setTimeout(function() {
       drone.stop();
	     drone.land();
     }, 3000);
   }
  });
};