const io = require("socket.io")(3000, {
    cors: {
        origin: "*" // Allows connections from the same network
    }
});

let players = {};

// Called when the socket connection is created
io.on("connection", socket => {
    console.log(socket.id + " connected");

    socket.on("playerUpdate", player => {
        players[player.networkId] = player;
        //let playersArr = Object.keys(players);
        socket.emit("playerClientUpdate", players);
    });

    socket.on("disconnect", () => {
        console.log("DISCONNECT " + socket.id);
        delete players[socket.id];
    });
});