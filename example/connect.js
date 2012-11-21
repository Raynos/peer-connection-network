var MuxDemux = require("mux-demux")
    , PeerConnectionShim = require("peer-connection-shim")
    , Peers = require("peer-nodes")
    , reconnect = require("reconnect/sock")

    , PeerConnectionPool = require("../")

module.exports = connect

function connect(options, callback) {
    console.log("listen", options.uri)


    // Connect to the remote sockJS server which acts as a
    // signal channel and a relay server
    reconnect(function (stream) {
        console.log("got stream")

        // Multiplex the connection due to sockJS limitation
        // Open up three streams for peer list replication,
        // signal channel for the pool & and the relay stream
        // for the peer connection shim
        var mdm = MuxDemux()

        stream.pipe(mdm).pipe(stream)

        var peerStream = mdm.createStream(
                "/v1/scuttlebutt/" + options.namespace)
            , poolStream = mdm.createStream(
                "/v1/echo/" + options.namespace)
            , relayStream = mdm.createStream(
                "/v1/relay/" + options.namespace)
            , peers = Peers()
            // Pass the pool a function which generates a new
            // PeerConnection. In this case use the shim but in
            // the future just use webrtc
            , pool = PeerConnectionPool(function () {
                return PeerConnectionShim({
                    stream: relayStream
                })
            })

        // pump the streams up
        peerStream.pipe(peers.createStream()).pipe(peerStream)
        poolStream.pipe(pool.createStream()).pipe(poolStream)

        // pass peers & pool to callback
        callback(peers, pool)
    }).listen(options.uri)
}
