var PeerConnection = require("peer-connection")
    , RemoteEvents = require("remote-events")
    , EventEmitter = require("events").EventEmitter

module.exports = PeerConnectionPool

function PeerConnectionPool(options) {
    var peerHash = {}
        , emitter = new RemoteEvents()
        , pool = new EventEmitter()
        , id

    if (typeof options === "function") {
        options = { createConnection: options }
    }

    pool.listen = listen
    pool.connect = connect
    pool.createStream = createStream

    return pool

    function listen(localId) {
        id = localId

        emitter.on(id + ":offer", onremoteoffer)

        emitter.on(id + ":answer", onremoteanswer)

        emitter.on(id + ":candidate", onremotecandidate)

        return pool
    }

    function onremoteoffer(remoteId, offer) {
        // console.log("onremoteoffer")
        var pc = createPeerConnection(remoteId)

        pc.createAnswer(offer, onlocalanswer)

        function onlocalanswer(err, answer) {
            if (err) {
                return pool.emit("error", err)
            }

            emitter.emit(remoteId + ":answer", id, answer)
        }
    }

    function onremoteanswer(remoteId, answer) {
        // console.log("onremoteanswer")
        var pc = peerHash[remoteId]

        pc.setRemote(answer)
    }

    function onremotecandidate(remoteId, candidate) {
        var pc = peerHash[remoteId]

        pc.addCandidate(candidate)
    }

    function connect(remoteId, name) {
        if (!id) {
            throw new Error("must listen before connect")
        }

        var pc = createPeerConnection(remoteId)

        pc.createOffer(onlocaloffer)

        return pc.connect(name)

        function onlocaloffer(err, offer) {
            if (err) {
                return pool.emit("error", err)
            }

            emitter.emit(remoteId + ":offer", id, offer)
        }
    }

    function createPeerConnection(remoteId) {
        var pc = peerHash[remoteId] = PeerConnection(
            options.createConnection())

        pc.on("candidate", onlocalcandidate)

        pc.on("connection", onconnection)

        return pc

        function onlocalcandidate(candidate) {
            emitter.emit(remoteId + ":candidate", id, candidate)
        }

        function onconnection(stream) {
            stream.peerId = remoteId

            pool.emit("connection", stream)
        }
    }

    function createStream() {
        return emitter.getStream()
    }
}
