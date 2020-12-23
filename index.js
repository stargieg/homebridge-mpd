var mpd = require('mpd');
var cmd = mpd.cmd;
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-mpd", "mpd", MpdAccessory);
}

//
// MPD Accessory
//
function MpdAccessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"] || 'MPD';
  this.host = config["host"] || 'localhost';
  this.port = config["port"] || 6600;
  
  this.client = mpd.connect({
    port: this.port,
    host: this.host,
  });

  this.service = new Service.Lightbulb(this.name);

  this.service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getOn.bind(this))
    .on('set', this.setOn.bind(this));
  
  this.service
    .addCharacteristic(new Characteristic.Brightness())
    .on('get', this.getVolume.bind(this))
    .on('set', this.setVolume.bind(this));
}

MpdAccessory.prototype.getServices = function() {
  return [this.service];
}

MpdAccessory.prototype.getOn = function(callback) {
  var accessory = this;

  this.client.sendCommand(cmd("status", []), function(err, msg) {
    if (err) {
      callback(err);
    }
    else {
      var response = mpd.parseKeyValueMessage(msg);
      var on = response.state == "play";
      accessory.log("player state: %s", response.state);
      callback(null, on);
    }
    
  });
}

MpdAccessory.prototype.setOn = function(on, callback) {
  this.log("Setting power to " + on);
  
  if (on) {
    this.client.sendCommand(cmd("play", []), function(err, msg) {
      if (err) {
        callback(err);
      }
      else {
        callback(null);
      } 
    });
  }
  else {
    this.client.sendCommand(cmd("stop", []), function(err, msg) {
      if (err) {
        callback(err);
      }
      else {
        callback(null);
      } 
    });
  }
}

MpdAccessory.prototype.getVolume = function(callback) {
  var accessory = this;

  this.client.sendCommand(cmd("status", []), function(err, msg) {
    if (err) {
      callback(err);
    }
    else {
      var response = mpd.parseKeyValueMessage(msg);
      var volume = response.volume;
      accessory.log("volume is %s", volume);
      callback(null, Number(volume));
    }
    
  });
}

MpdAccessory.prototype.setVolume = function(volume, callback) {
  this.log("Setting volume to %s", volume);

  this.client.sendCommand(cmd("setvol", [volume]), function(err, msg) {
    if (err) {
      callback(err);
    }
    else {
      callback(null);
    }   
  });
}
