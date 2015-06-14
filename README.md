#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

> Replicate a PouchDB over a WebRTC DataChannel.


## Install

```sh
$ npm install --save pouch-replicate-webrtc
```


## Usage

```js
var PouchDB = require('pouchdb');
var PouchReplicator = require('pouch-replicate-webrtc');

var pouchDb = new PouchDB('myDb');
var replicator = new PouchReplicator('https://switchboard.rtc.io/', {room: 'pouch-replicate-test'}, pouchDb);
replicator.join();
replicator.replicate();

```


## License

MIT © [Scott Dietrich](http://minutestopost.com)
