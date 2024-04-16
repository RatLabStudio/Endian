import { CPU } from "./cpu/cpu.js";
import { Server } from "socket.io";

import * as Simulation from "./simulation/old/simulationOLD.js";
import * as SimulationManager from "./simulation/old/SimManagerOLD.js";

const io = new Server(3000, {
    cors: {
        origin: "*" // Allows connections from the same network
    }
});

export let objects = [];
export let players = {};
export let cpus = {};
let movingObjects = [];
export let rays = [];
let displayRays = {};
export let playerInfo = {};
let newChatMessages = [];

// Called when the socket connection is created
io.on("connection", socket => {
    console.log(socket.id + " connected");

    // Receive updates from player
    socket.on("playerUpdate", player => {
        players[socket.id] = player;
        socket.emit("playerClientUpdate", players);
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


    /////////////// Networked Objects ///////////////

    socket.on("moveNetworkObject", data => {
        movingObjects.push(data);
        //socket.emit("movedNetworkObject", data);
    });

    socket.on("requestMovedNetworkObjects", () => {
        SimulationManager.movedNetworkObjects(movingObjects);
        movingObjects = [];
    });

    /////////////////////////////////////////////


    /////////////// CPU Management ///////////////

    socket.on("createCpu", (id) => {
        cpus[id] = new CPU(id);

        let computer = cpus[id].gpu;

        /*for (let i = 0; i < 127; i++) {
            for (let j = 0; j < 95; j++)
                computer.setPixel(i, j, "blue");
        }*/

        computer.nextLine();
        computer.printString('Endian CPU');
        computer.nextLine();
        computer.printString('Simulation Running...');
        computer.nextLine();
        computer.nextLine();
        computer.printString("");
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

    /////////////////////////////////////////////


    /////////////// Rays ///////////////

    socket.on("shootRay", ray => {
        rays.push(ray);
    });

    socket.on("requestRays", () => {
        SimulationManager.sendRays(rays);
        rays = [];
    });

    socket.on("sendRayDisplayInfo", rays => {
        displayRays = rays;
    });

    socket.on("requestRayDisplayInfo", () => {
        socket.emit("sendRayDisplayInfoToPlayers", displayRays);
    });

    /////////////////////////////////////////////


    /////////////// Player Info ///////////////

    socket.on("sendPlayerInfo", newPlayerInfo => {
        playerInfo = newPlayerInfo;
    });

    socket.on("requestPlayerInfo", networkId => {
        if (playerInfo[networkId])
            socket.emit("playerInfoUpdate", playerInfo[networkId]);
    });

    /////////////////////////////////////////////


    /////////////// Chat ///////////////

    socket.on("sendChatMessage", messageData => {
        newChatMessages.push(messageData);
    });

    socket.on("clearNewChatMessages", () => {
        newChatMessages = [];
    });

    socket.on("requestNewChatMessages", () => {
        socket.emit("sendNewChatMessages", newChatMessages);
        newChatMessages = [];
    });

    /////////////////////////////////////////////
});