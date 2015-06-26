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
    // debug: true,
    plugins: [ require('rtc-plugin-node') ]
  };

  var pouch1, pouch2, pouch3, replicator1, replicator2, replicator3;
  var doc1 = {_id: 'cats', name: 'cats'};
  var doc2 = {_id: 'dogs', name: 'dogs'};
  var doc3 = {_id: 'circles', name: 'circles'};
  var doc4 = {_id: 'squares', name: 'squares'};
  var doc5 = {_id: 'tables', name: 'tables'};
  var doc6 = {_id: 'chairs', name: 'chairs'};

  before(function(done) {
    pouch1 = new PouchDB('pouch1', {db: require('memdown')});
    pouch2 = new PouchDB('pouch2', {db: require('memdown')});
    pouch3 = new PouchDB('pouch3', {db: require('memdown')});

    replicator1 = new PouchReplicator('http://localhost:3000/', rtcOpts, pouch1);
    replicator2 = new PouchReplicator('http://localhost:3000/', rtcOpts, pouch2);
    replicator3 = new PouchReplicator('http://localhost:3000/', rtcOpts, pouch3);

    Promise.all([replicator1.join(2), replicator2.join(2), replicator3.join(2)])
      .then(function() {
        return Promise.all([
          pouch1.put(doc1),
          pouch1.put(doc2),
          pouch2.put(doc3),
          pouch2.put(doc4),
          pouch3.put(doc5),
          pouch3.put(doc6)
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
    Promise.all([replicator2.replicate(), replicator1.replicate(), replicator3.replicate()])
    .then(function() {
      replicator1.close();
      replicator2.close();
      replicator3.close();
    })
    .then(function() {
      return pouch1.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      // console.log('pouch1 rows: ' + JSON.stringify(results));
      assert.equal(results.total_rows, 6);
    })
    .then(function() {
      return pouch3.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      // console.log('pouch3 rows: ' + JSON.stringify(results));
      assert.equal(results.total_rows, 6);
    })
    .then(function() {
      return pouch2.allDocs({
        include_docs: true,
        attachments: true
      })
    })
    .then(function(results) {
      // console.log('pouch2 rows: ' + JSON.stringify(results));
      assert.equal(results.total_rows, 6);
      done();
    });

  });

});
