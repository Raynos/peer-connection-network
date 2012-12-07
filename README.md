# peer-connection-network

network of peer connections

## Example

```js
var WriteStream = require("write-stream")
    , uuid = require("node-uuid")
    , assert = require("assert")
    , connect = require("signal-channel/connect")

// connect to the signal channel.
// This is a high level utility function. All the pieces are
// composable and you can build your own.
connect({
    uri: "//signalchannel.co/sock"
    , namespace: "unique name for app"
}, function (peers, network) {
    // You are given a peers and network object. peers is a
    // distributed list of all peers connected to your signal
    // channel server on your namespace.

    // network is a peer connection networking abstraction giving you
    // a dead simple API for connecting to peers and listening
    // on incoming requests from peers

    // You need a unique id to distinguish yourself. Probably
    // best to use a unique user name instead.
    var id = uuid()

    // Listen to the network on your own identifier.
    // For each new incoming connection just echo back their data
    network.listen(id).on("connection", function (stream) {
        stream.pipe(stream)
        stream.pipe(WriteStream(function onecho(message) {
            console.log("echo got message", message)
        }))
    })

    // For each new peer, open a connection to them and see
    // whether they echo it back
    peers.on("join", function (peer) {
        if (peer.id <= id) {
            // OTHER SIDE HANDLES IT. PEER TO PEER IS SYMETTRIC
            return
        }

        var stream = network.connect(peer.id)

        stream.pipe(WriteStream(function onwrite(message) {
            console.log("got message", message)
            assert.equal(message, "hello world")
        }))

        stream.write("hello world")
    })

    peers.join({ id: id })
})
```

## Installation

`npm install peer-connection-network`

## Contributors

 - Raynos

## MIT Licenced
