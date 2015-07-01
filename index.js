'use strict';

var stream = require('stream');
var replicationStream = require('pouchdb-replication-stream');
var quickconnect = require('rtc-quickconnect')
var RtcDataStream = require('rtcstream');
var concat = require('concat-stream');
var Promise = require('promise');
var PouchDB = require('pouchdb');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var PouchReplicator = function(name, signalUrl, rtcOptions, pouchDb, replicationOptions) {
  this.name = name;
  this.signalUrl = signalUrl;
  this.rtcOptions = rtcOptions;
  this.pouchDb = pouchDb;
  this.replicationOptions = replicationOptions;

  this.streams = [];
  this.peers = [];

  EventEmitter.call(this);
  PouchDB.plugin(replicationStream.plugin);
  PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);
};

util.inherits(PouchReplicator, EventEmitter);

PouchReplicator.prototype.addPeer = function(id, dc) {
  var self = this;

  var stream = new RtcDataStream(this.name + ':' + id, dc);
  this.peers.push(id);
  this.streams.push(stream);

  stream.on('data', this.receiveData.bind(this));
}

PouchReplicator.prototype._createStream = function(chunk) {
  var s = new stream.Readable();
  s._read = function() {};
  s.push(chunk);
  s.push(null);

  return s;
}
PouchReplicator.prototype.receiveData = function(chunk) {
  var self = this;

  var s = self._createStream(chunk);
  self.pouchDb.load(s, this.replicationOptions)
  .then(function(res) {
    self.emit('load');
  });
};

PouchReplicator.prototype.removePeer = function(id) {
  var idx = this.peers.indexOf(id);
  if (idx >= 0) {
    this.peers.splice(idx, 1);
    this.streams.splice(idx, 1);
  }
};

/**
 * Join webrtc datachannel
 @ @return  {Promise}
 */
PouchReplicator.prototype.join = function(minPeers) {
  minPeers = typeof minPeers !== 'undefined' ? minPeers : 0;
  var self = this;

  var p = new Promise(function(resolve, reject) {
    self.signaller = quickconnect(self.signalUrl, self.rtcOptions);
    self.signaller.createDataChannel(self.rtcOptions.room)
      .on('channel:opened:' + self.rtcOptions.room, function(id, dc) {
        self.addPeer(id, dc);
        if (self.peers.length >= minPeers) {
          resolve();
        }
      })
      .on('channel:closed:' + self.rtcOptions.room, function(id, dc) {
        self.removePeer(id);
      });
  });

  return p;
};

/**
 * Start PouchDB replication
 @ @return  {Promise}
 */
PouchReplicator.prototype.replicate = function() {
  var self = this;
  var replicationPromises = [];

  var database = '';
  var concatStream = concat({encoding: 'string'}, function (line) {
    database += line;
  });

  var p = self.pouchDb.dump(concatStream)
  .then(function() {
    self.streams.forEach(function(s) {
      s.write(database);
    });

  });

  return p;
};

PouchReplicator.prototype.close = function() {
  this.signaller.close();
};

PouchReplicator.prototype.getPeers = function() {
  return this.peers;
};

module.exports = PouchReplicator;
