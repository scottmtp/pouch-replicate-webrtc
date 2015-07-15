'use strict';
var chai = require('chai')
var assert = chai.assert;
var expect = chai.expect;
var cuid = require('cuid');
var EventEmitter = require('events').EventEmitter;

var Promise = require('promise');
var PouchDB = require('pouchdb');
var PouchReplicator = require('../');

describe('pouch-replicate-webrtc node module', function () {

  var pouch1, pouch2, pouch3, replicator1, replicator2, replicator3;
  var channel1, channel2, channel3;
  var doc1 = {_id: 'cats', name: 'cats'};
  var doc2 = {_id: 'dogs', name: 'dogs'};
  var doc3 = {_id: 'circles', name: 'circles'};
  var doc4 = {_id: 'squares', name: 'squares'};
  var doc5 = {_id: 'tables', name: 'tables'};
  var doc6 = {_id: 'chairs', name: 'chairs'};

  function getChannel() {
    var channel = new EventEmitter();
    channel.addEventListener = function(msg, func) {
      channel.on(msg, func);
    };

    channel.send = function(chunk) {
      this.emit('message', chunk);
    };

    return channel;
  }

  function setupChannels() {
    channel1 = getChannel();
    channel2 = getChannel();
    channel3 = getChannel();

    replicator1.addPeer('replicator2', channel2);
    replicator1.addPeer('replicator3', channel3);
    replicator2.addPeer('replicator1', channel1);
    replicator2.addPeer('replicator3', channel3);
    replicator3.addPeer('replicator1', channel1);
    replicator3.addPeer('replicator2', channel2);
  }

  // TODO: this pause seems fragile, investigate better options
  // pause to allow replication to complete
  var pauseFunction = function() {
    var p = new Promise(function (resolve, reject){
      setTimeout(function () {
        resolve();
      }, 50)
    });

    return p;
  };

  beforeEach(function(done) {
    var replicationOptions = {
      batch_size: 1
    };

    pouch1 = new PouchDB(cuid(), {db: require('memdown')});
    pouch2 = new PouchDB(cuid(), {db: require('memdown')});
    pouch3 = new PouchDB(cuid(), {db: require('memdown')});

    replicator1 = new PouchReplicator('replicator1', pouch1, replicationOptions);
    replicator2 = new PouchReplicator('replicator2', pouch2, replicationOptions);
    replicator3 = new PouchReplicator('replicator3', pouch3, replicationOptions);

    setupChannels();

    Promise.all([
      pouch1.put(doc1),
      pouch1.put(doc2),
      pouch2.put(doc3),
      pouch2.put(doc4),
      pouch3.put(doc5),
      pouch3.put(doc6)])
    .then(function() {
      done();
    });
  });

  it('should find setup documents', function(done) {
    pouch1.allDocs({
      include_docs: true,
      attachments: true
    })
    .then(function(results) {
      assert.equal(results.total_rows, 2);
      done();
    });
  });

  it('should emit when done loading', function(done) {
    var executed = false;
    replicator2.on('endpeerreplicate', function() {
      if (!executed) {
        done();
        executed = true;
      }
    });

    Promise.all([replicator2.replicate(), replicator1.replicate(), replicator3.replicate()])
    .then(pauseFunction)
    .catch(function(error) {
      console.log(error.stack);
    });
  });

  it('should replicate', function (done) {
    Promise.all([replicator2.replicate(), replicator1.replicate(), replicator3.replicate()])
    .then(pauseFunction)
    .then(function() {
      return pouch1.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      assert.equal(results.total_rows, 6);
    })
    .then(function() {
      return pouch3.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      assert.equal(results.total_rows, 6);
    })
    .then(function() {
      return pouch2.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      assert.equal(results.total_rows, 6);
      done();
    })
    .catch(function(error) {
      console.log(error.stack);
    });

  });

  it('should replicate multiple times on the same stream', function (done) {
    Promise.resolve(replicator1.replicate())
    .then(replicator2.replicate())
    .then(replicator3.replicate())
    .then(pauseFunction)
    .then(function() {
      return pouch1.put({_id: 'a', name: 'a'});
    })
    .then(function(result) {
      return replicator1.replicate();
    })
    .then(pauseFunction)
    .then(function() {
      return pouch2.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      assert.equal(results.total_rows, 7);
      done();
    })
    .catch(function(error) {
      console.log(error.stack);
    });
  });

});
