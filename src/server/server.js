import * as Socket from 'socket.io';

import * as Simulation from "./simulation/simulation.js";
import { Player } from './simulation/objects/Player.js';
import { CPU } from "./cpu/cpu.js";

const io = new Socket.Server(3000, {
    cors: {
        origin: "*" // Allows connections from the same network
    }
});

export let players = {}; // All players currently connected
export let cpus = {}; // All CPUs in the scene

let movingObjects = []; // Objects that are currently being moved by a player

export let rays = []; // Active rays (bullets)
let displayRays = {}; // Rays to be displayed (reflects rays[])

// Called when the socket connection is created
io.on("connection", socket => {
    console.log(socket.id + " connected");


    /////////////// Player Management ///////////////

    // Receive updates from player
    socket.on("playerUpdate", player => {
        if (!players[player.networkId]) {
            players[player.networkId] = new Player(player.networkId);
            Simulation.game.world.addBody(players[player.networkId].object.body);

            sendMessageToAllPlayers({
                message: `${player.username} joined the game`,
                color: 'yellow'
            });
        }

        players[player.networkId].updateFromServer(player);

        // Get simplified player data
        let playerKeys = Object.keys(players);
        let playerData = {};
        for (let i = 0; i < playerKeys.length; i++)
            playerData[playerKeys[i]] = players[playerKeys[i]].getData();

        // Send the new data to all connected players
        socket.emit("playerClientUpdate", playerData);
    });

    // When a player leaves
    socket.on("disconnect", () => {
        console.log(`${socket.id} disconnected`);
        if (players[socket.id]) {
            Simulation.game.world.removeBody(players[socket.id].object.body);
            sendMessageToAllPlayers({
                message: `${players[socket.id].username} left the game`,
                color: 'tomato'
            });
        }
        delete players[socket.id];
    });

    /////////////////////////////////////////////


    // Called by client
    socket.on("requestSimulationUpdate", () => {
        let objKeys = Object.keys(Simulation.objects);
        let compressedObjs = {};
        for (let i = 0; i < objKeys.length; i++)
            compressedObjs[objKeys[i]] = Simulation.objects[objKeys[i]].compress();

        socket.emit("objectUpdates", compressedObjs);
    });

    socket.on("requestSimulationForView", () => {
        // Compress objects
        let objKeys = Object.keys(Simulation.objects);
        let compressedObjs = {};
        for (let i = 0; i < objKeys.length; i++)
            compressedObjs[objKeys[i]] = Simulation.objects[objKeys[i]].compress();

        // Compress players
        let playerKeys = Object.keys(players);
        let compressedPlayers = {};
        for (let i = 0; i < playerKeys.length; i++)
            compressedPlayers[playerKeys[i]] = players[playerKeys[i]].getData();

        // Send Data
        socket.emit("sendSimulationSceneForView", { objects: compressedObjs, players: compressedPlayers });
    });


    /////////////// Networked Objects ///////////////

    socket.on("moveNetworkObject", data => {
        movingObjects = [data];
        Simulation.moveNetworkObjects(movingObjects);
    });

    /////////////////////////////////////////////


    /////////////// CPU Management ///////////////

    

    /////////////////////////////////////////////


    /////////////// Chat and Console ///////////////

    socket.on("sendMessageToServer", message => {
        sendMessageToAllPlayers(message);
    });

    socket.on("requestNewChatMessages", () => {
        if (players[socket.id]) {
            socket.emit("sendNewChatMessages", players[socket.id].newChatMessages);
            players[socket.id].newChatMessages = [];
        }
    });

    /////////////////////////////////////////////
});

/////////////////////////////////////////////

export function createCpu(id) {
    cpus[id] = new CPU(id);

    let computer = cpus[id].gpu;

    for (let i = 0; i < 127; i++) {
        for (let j = 0; j < 95; j++)
            computer.setPixel(i, j, computer.backgroundColor);
    }

    computer.nextLine();
    computer.printString('Endian CPU');
    computer.nextLine();
    computer.printString('Simulation Running...');
    computer.nextLine();
    computer.nextLine();
    computer.printString("");
};

export function sendMessageToAllPlayers(message) {
    let playerKeys = Object.keys(players);
    for (let i = 0; i < playerKeys.length; i++)
        players[playerKeys[i]].newChatMessages.push(message);
}