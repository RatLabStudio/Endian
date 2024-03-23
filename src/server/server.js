const io = require("socket.io")(3000, {
    cors: {
        origin: "*" // Allows connections from the same network
    }
});

let objects = [];

let players = {};

// Called when the socket connection is created
io.on("connection", socket => {
    console.log(socket.id + " connected");

    socket.on("playerUpdate", player => {
        players[socket.id] = player;
        socket.emit("playerClientUpdate", players);
    });

    socket.on("requestPlayerUpdates", () => {
        socket.emit("playerSimulationUpdate", players);
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        console.log(`${socket.id} disconnected`);
    });

    socket.on("simulationUpdate", (objs) => {
        objects = objs;
        socket.emit("objectUpdates", objs);
    });

    socket.on("requestSimulationUpdate", () => {
        socket.emit("objectUpdates", objects);
    });
});