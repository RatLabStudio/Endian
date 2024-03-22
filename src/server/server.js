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
        // TODO: Send new player information to server
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        console.log(`${socket.id} disconnected`);
    });

    socket.on("recieveUpdatesFromSimulation", (objs) => {
        console.log(objs);
        socket.emit("networkObjectUpdatesFromServer", objs);
    });

    // Recieves new object from client
    socket.on("createObject", (newObject) => {
        objects.push(newObject);
    });
});