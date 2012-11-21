var WriteStream = require("write-stream")
    , uuid = require("node-uuid")
    , assert = require("assert")

    , connect = require("./connect")

// connect to the signal channel
connect({
    uri: "//localhost:8080/sock"
    , namespace: "unique name for app"
}, function (peers, pool) {
    console.log("called callback")

    // You are given a peers and pool object. peers is a
    // distributed list of all peers connected to your signal
    // channel server on your namespace.

    // pool is a peer connection pooling abstraction giving you
    // a dead simple API for connecting to peers and listening
    // on incoming requests from peers

    // You need a unique id to distinguish yourself. Probably
    // best to use a unique user name instead.
    var id = uuid()

    console.log("my own id", id)

    // Listen to the pool on your own identifier.
    // For each new incoming connection just echo back their data
    pool.listen(id).on("connection", function (stream) {
        console.log("new connection", stream.peerId)
        stream.pipe(stream)
    })

    // For each new peer, open a connection to them and see
    // whether they echo it back
    peers.on("join", function (peer) {
        if (peer.id <= id) {
            console.log("other side or self?", peer.id, id)
            // OTHER SIDE HANDLES IT. PEER TO PEER IS SYMETTRIC
            return
        }

        console.log("creating stream")
        var stream = pool.connect(peer.id)

        stream.pipe(WriteStream(function onwrite(message) {
            console.log("got message", message)
            assert.equal(message, "hello world")
        }))

        stream.write("hello world")
    })

    peers.join({ id: id })
})
