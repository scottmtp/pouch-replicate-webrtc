'use strict';
var chai = require('chai')
var assert = chai.assert;
var expect = chai.expect;

var Promise = require('promise');
var PouchDB = require('pouchdb');
var PouchReplicator = require('../');

describe('pouch-replicate-webrtc node module', function () {

  var rtcOpts = {
    room: 'pouch-replicate-test',
    plugins: [ require('rtc-plugin-node') ]
  };

  var pouch1, pouch2, replicator1, replicator2;
  var doc1 = {_id: 'cats', name: 'cats'};
  var doc2 = {_id: 'dogs', name: 'dogs'};
  var doc3 = {_id: 'circles', name: 'circles'};
  var doc4 = {_id: 'squares', name: 'squares'};

  before(function(done) {

    pouch1 = new PouchDB('pouch1', {db: require('memdown')});
    pouch2 = new PouchDB('pouch2', {db: require('memdown')});

    replicator1 = new PouchReplicator('http://localhost:3000/', rtcOpts, pouch1);
    replicator2 = new PouchReplicator('http://localhost:3000/', rtcOpts, pouch2);

    Promise.all([replicator1.join(), replicator2.join()])
      .then(function() {
        return Promise.all([
          pouch1.put(doc1),
          pouch1.put(doc2),
          pouch2.put(doc3),
          pouch2.put(doc4)
        ]);
      })
      .then(function() {
        done();
      });
  });

  beforeEach(function() {

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

  it('should replicate', function (done) {
    Promise.all([replicator1.replicate(), replicator2.replicate()])
    .then(function() {
      replicator1.close();
      replicator2.close();
    })
    .then(function() {
      return pouch1.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      assert.equal(results.total_rows, 4);
    })
    .then(function() {
      return pouch2.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      assert.equal(results.total_rows, 4);
      done();
    });

  });

});
