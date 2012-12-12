# peer-connection-network

network of peer connections

## Example

```js
var relay = require("signal-channel/relay")
    , PeerConnectionShim = require("peer-connection-shim")

    , Network = require("peer-connection-network")

var net1 = Network(createPeerConnection)
    , net2 = Network(createPeerConnection)

var stream1 = net1.createStream()
    , stream2 = net2.createStream()

stream1.pipe(stream2).pipe(stream1)

net1.listen("foo")
net2.listen("bar")

net2.on("connection", function (pc) {
    var stream = pc.createStream("foo")
    stream.write("hello world")
})

var pc = net1.connect("bar")
pc.on("connection", function (stream) {
    stream.on("data", function (chunk) {
        console.log("data", String(chunk))
    })
})

// Use the peer connect shim which requires a relay server connection
function createPeerConnection() {
    return PeerConnectionShim({
        stream: relay("peer-connection-network example")
    })
}

```

## Installation

`npm install peer-connection-network`

## Contributors

 - Raynos

## MIT Licenced
