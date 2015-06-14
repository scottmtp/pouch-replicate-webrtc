'use strict';

var replicationStream = require('pouchdb-replication-stream');
var quickconnect = require('rtc-quickconnect')
var createDataStream = require('rtc-dcstream');
var Promise = require('promise');
var PouchDB = require('pouchdb');

module.exports = function(signalUrl, rtcOptions, pouchDb) {
  var _quickconnect, _dataChannel, _stream, _peerId, _signalUrl, _options, _pouchDb;
  _signalUrl = signalUrl;
  _options = rtcOptions;
  _pouchDb = pouchDb;

  PouchDB.plugin(replicationStream.plugin);
  PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

  return {
    /**
     * Join webrtc datachannel
     @ @return  {Promise}
     */
    join: function() {
      var p = new Promise(function(resolve, reject) {
        _quickconnect = quickconnect(_signalUrl, _options);
        _quickconnect.createDataChannel('pouch')
          .on('channel:opened:pouch', function(id, dc) {
            _peerId = id;
            _dataChannel = dc;
            _stream = createDataStream(_dataChannel);
            resolve();
          });
      });

      return p;
    },

    /**
     * Start PouchDB replication
     @ @return  {Promise}
     */
    replicate: function() {
      var p = new Promise(function(resolve, reject) {
        Promise.all([
          _pouchDb.dump(_stream),
          _pouchDb.load(_stream)
        ]).then(function () {
          resolve();
        });
      })

      return p;
    },

    close: function() {
      _quickconnect.close();
    }
  }
};
