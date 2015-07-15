#  pouch-replicate-webrtc

Replicate a PouchDB over a WebRTC DataChannel, for NodeJS and the Browser.

## About

By using a WebRTC DataChannel, we can share data between browsers without storing
the data on a centralized server.

Uses [pouchdb-replication-stream](https://github.com/nolanlawson/pouchdb-replication-stream)
for replicating PouchDB data.

## Install

This library can be used both on Serverside and on Clientside.

### On Serverside, using NodeJS

```
$ npm install --save pouch-replicate-webrtc
```

### On Clientside

You can import the pouch-replicate-webrtc.min.js from the dist folder.

Alternatively, you can user Bower to install it:
```
$ bower install --save pouch-replicate-webrtc
```

## Usage

Example using [rtc-quickconnect](https://github.com/rtc-io/rtc-quickconnect):

```
var PouchDB = require('pouchdb');
var PouchReplicator = require('pouch-replicate-webrtc');
var quickconnect = require('rtc-quickconnect');

var pouchDb = new PouchDB('myDb');
var replicator = new PouchReplicator('replicator', pouchDb, {batch_size: 50});

replicator.on('endpeerreplicate', function() {
  console.log('received data from replication');
});

quickconnect('https://switchboard.rtc.io/', { room: 'qc-simple-demo' })
  .createDataChannel('replication')
  .on('channel:opened:replication', function(id, dc) {
    replicator.addPeer(id, dc);
    replicator.replicate();
  });

```

## Build

### Clientside

To build the Clientside version, you will need to run:

```
npm install
npm run browserify
```

## License

MIT © [Scott Dietrich](http://minutestopost.com)
