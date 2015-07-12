#  pouch-replicate-webrtc

Replicate a PouchDB over a WebRTC DataChannel.

## About

By using a WebRTC DataChannel, we can share data between browsers without storing 
the data on a centralized server.

Uses [pouchdb-replication-stream](https://github.com/nolanlawson/pouchdb-replication-stream)
for replicating PouchDB data.

## Install

```
$ npm install --save pouch-replicate-webrtc
```

Currently tests require an rtc-switchboard running locally on port 3000.

https://github.com/rtc-io/rtc-switchboard


## Usage

```
var PouchDB = require('pouchdb');
var PouchReplicator = require('pouch-replicate-webrtc');

var pouchDb = new PouchDB('myDb');
var replicator = new PouchReplicator('replicator', 'https://switchboard.rtc.io/'
  , {room: 'pouch-replicate-test'}, pouchDb, {batch_size: 50});

replicator.on('endpeerreplicate', function() {
  console.log('received data from replication');
});

replicator.join()
  .then(function() {
    replicator.replicate();
  });

```


## License

MIT © [Scott Dietrich](http://minutestopost.com)
