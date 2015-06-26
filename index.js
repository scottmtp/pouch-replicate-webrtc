'use strict';

var replicationStream = require('pouchdb-replication-stream');
var quickconnect = require('rtc-quickconnect')
var createDataStream = require('rtc-dcstream');
var Promise = require('promise');
var PouchDB = require('pouchdb');

module.exports = function(signalUrl, rtcOptions, pouchDb, replicationOptions) {
  var _quickconnect, _signalUrl, _rtcOptions, _pouchDb, _replicationOptions;
  _signalUrl = signalUrl;
  _rtcOptions = rtcOptions;
  _pouchDb = pouchDb;
  _replicationOptions = replicationOptions;

  var _streams = [];
  var _peers = [];

  PouchDB.plugin(replicationStream.plugin);
  PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

  function addPeer(id, dc) {
    var stream = createDataStream(dc);
    _peers.push(id);
    _streams.push(stream);

    stream.on('end', function() {
      _pouchDb.load(stream, _replicationOptions)
      .catch(function(error) {
        console.log(error.stack);
      });
    });
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
        _quickconnect = quickconnect(_signalUrl, rtcOptions);
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
    },

    on: function(callback) {
      _quickconnect.on(callback);
    }
  }
};
