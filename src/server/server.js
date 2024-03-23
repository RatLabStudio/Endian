const CPU = require("./cpu/cpu");

const io = require("socket.io")(3000, {
    cors: {
        origin: "*" // Allows connections from the same network
    }
});

let objects = [];
let players = {};
let cpus = {};

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

    socket.on("createCpu", (id) => {
        cpus[id] = new CPU(id);
        
        let computer = cpus[id].gpu;
        computer.nextLine();
        computer.printString('  Endian CPU');
        computer.nextLine();
        computer.printString('  Simulation Running...');
        computer.nextLine();
        computer.nextLine();
        computer.printString("  ");
    });

    socket.on("requestAllCpuData", () => {
        let cpuData = {};
        let cpuKeys = Object.keys(cpus);
        for (let i = 0; i < cpuKeys.length; i++)
            cpuData[cpuKeys[i]] = cpus[cpuKeys[i]].getData();
        socket.emit("cpuUpdateAll", cpuData);
    });

    socket.on("requestCpuData", (cpuId) => {
        let cpuData = cpus[cpuId].getData();
        socket.emit("cpuUpdate", cpuData);
    });

    socket.on("cpuInput", (cpuId, inputChar) => {
        if (cpus[cpuId])
            cpus[cpuId].gpu.printCharacter(inputChar);
    });
});