'use strict';

var replicationStream = require('pouchdb-replication-stream');
var quickconnect = require('rtc-quickconnect')
var webRtcStream = require('rtc-data-stream');
var freeice = require('freeice');
var Promise = require('promise');

module.exports = {

  /**
   * Join webrtc room
   * @param {PouchDB} db
   * @param {String} signalUrl The URL of the signal server
   * @param {String} name The room name
   @ @return  {Promise}
   */
  join: function(db, signalUrl, name) {
    PouchDB.plugin(replicationStream.plugin);
    PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

    var opts = {
      room: name,
      iceServers: freeice()
    };

    var p = new Promise(function(resolve, reject) {
      quickconnect(signalUrl, opts)
        .createDataChannel('pouch')
        .on('channel:opened:pouch', function(id, dc) {
          console.log('Peer: ' + id)

          var stream = webRtcStream(dc)

          Promise.all([
            db.dump(stream),
            db.load(stream)
          ]).then(function () {
            console.log('Replication complete');
            return p.resolve();
          });

        });
    });



    return p;
  }
};
