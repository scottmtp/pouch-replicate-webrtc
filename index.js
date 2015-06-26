'use strict';

var replicationStream = require('pouchdb-replication-stream');
var quickconnect = require('rtc-quickconnect')
var createDataStream = require('rtc-dcstream');
var Promise = require('promise');
var PouchDB = require('pouchdb');

module.exports = function(signalUrl, rtcOptions, pouchDb) {
  var _quickconnect, _signalUrl, _options, _pouchDb;
  _signalUrl = signalUrl;
  _options = rtcOptions;
  _pouchDb = pouchDb;

  var _streams = [];
  var _peers = [];

  PouchDB.plugin(replicationStream.plugin);
  PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

  function addPeer(id, dc) {
    _peers.push(id);
    _streams.push(createDataStream(dc));
  }

  function removePeer(id) {
    var idx = _peers.indexOf(id);
    if (idx >= 0) {
      _peers.splice(idx, 1);
      _streams.splice(idx, 1);
    }
  }

  return {
    /**
     * Join webrtc datachannel
     @ @return  {Promise}
     */
    join: function(minPeers) {
      minPeers = typeof minPeers !== 'undefined' ? minPeers : 0;

      var room = 'pouch';
      var p = new Promise(function(resolve, reject) {
        _quickconnect = quickconnect(_signalUrl, _options);
        _quickconnect.createDataChannel(room)
          .on('channel:opened:' + room, function(id, dc) {
            addPeer(id, dc);

            if (_peers.length >= minPeers) {
              resolve();
            }
          })
          .on('channel:closed:' + room, function(id, dc) {
            removePeer(id);
          });
      });

      return p;
    },

    /**
     * Start PouchDB replication
     @ @return  {Promise}
     */
    replicate: function() {
      var replicationPromises = [];
      _streams.forEach(function(s) {
        replicationPromises.push(_pouchDb.dump(s));
        replicationPromises.push(_pouchDb.load(s));
      });

      var p = new Promise(function(resolve, reject) {
        Promise.all(replicationPromises)
        .then(function () {
          resolve();
        });
      })

      return p;
    },

    close: function() {
      _quickconnect.close();
    },

    getPeers: function() {
      return _peers;
    }
  }
};
