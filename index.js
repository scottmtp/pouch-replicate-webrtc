'use strict';

var stream = require('stream');
var replicationStream = require('pouchdb-replication-stream');
var concat = require('concat-stream');
var Promise = require('promise');
var PouchDB = require('pouchdb');
var util = require('util');
var ReplicatorCommon = require('replicate-common');

var PouchReplicator = function(name, signalUrl, rtcOptions, pouchDb, replicationOptions) {
  ReplicatorCommon.call(this, name, signalUrl, rtcOptions);
  
  // PouchReplicator
  this.pouchDb = pouchDb;
  this.replicationOptions = replicationOptions;
  
  PouchDB.plugin(replicationStream.plugin);
  PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);
};

util.inherits(PouchReplicator, ReplicatorCommon);

module.exports = PouchReplicator;

PouchReplicator.prototype._createStream = function(chunk) {
  var s = new stream.Readable();
  s._read = function() {};
  s.push(chunk);
  s.push(null);

  return s;
};

PouchReplicator.prototype.receiveData = function(chunk) {
  var self = this;

  var s = self._createStream(chunk);
  self.pouchDb.load(s, this.replicationOptions)
  .then(function(res) {
    self.emit('endload');
  });
};

/**
 * Start PouchDB replication
 @ @return  {Promise}
 */
PouchReplicator.prototype.replicate = function() {
  var self = this;

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
