const { PeerServer } = require('peer');

const peerServer = PeerServer({ port: 3030, path: '/myapp' });

console.log("here");