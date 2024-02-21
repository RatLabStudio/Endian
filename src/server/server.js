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
        players[socket.id] = player;
        socket.emit("playerClientUpdate", players);
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        console.log(`${socket.id} disconnected`);
    });
});