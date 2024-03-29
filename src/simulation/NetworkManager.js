import { io } from "socket.io-client";

import * as Resources from './Resources.js';

let ip = "localhost";
const socket = io(`http://${ip}:3000`);

let game = null;
export function initializeGame(newGame) {
    game = newGame;
}

let players = {};
let playerObjs = {};

socket.on("connect", () => {
    console.log(`Simulation ID: ${socket.id}`);
    try {
        document.getElementById("netId").innerHTML = socket.id;
    } catch {
        // Headless Mode
    }
});

export function requestPlayerUpdates() {
    socket.emit("requestPlayerUpdates");
}

socket.on("playerSimulationUpdate", newPlayers => {
    let newPlayerKeys = Object.keys(newPlayers);
    for (let i = 0; i < newPlayerKeys.length; i++) {
        if (!players[newPlayerKeys[i]]) {
            // Create new player
            players[newPlayerKeys[i]] = newPlayers[newPlayerKeys[i]];
            playerObjs[players[newPlayerKeys[i]].networkId] = Resources.createObject("player");
            let playerObj = playerObjs[players[newPlayerKeys[i]].networkId];

            let playerData = players[newPlayerKeys[i]];
            playerObj.body.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
            //playerObj.body.quaternion.set(playerData.quaternion.x, playerData.quaternion.y, playerData.quaternion.z, playerData.quaternion.w);
            game.scene.add(playerObj.mesh);
            game.world.addBody(playerObj.body);
        } else {
            // Update existing Player
            playerObjs[players[newPlayerKeys[i]].networkId].setPosition(
                newPlayers[newPlayerKeys[i]].position.x,
                newPlayers[newPlayerKeys[i]].position.y - 1,
                newPlayers[newPlayerKeys[i]].position.z
            );
        }
    }

    // Remove players who have disconnected
    let playerKeys = Object.keys(players);
    for (let i = 0; i < playerKeys.length; i++) {
        if (!newPlayers[playerKeys[i]]) {
            delete players[playerKeys[i]];
            let player = playerObjs[playerKeys[i]];
            game.scene.remove(player.mesh); // Remove player model
            player.material.dispose(); // Dispose of model texture
            game.world.removeBody(player.body); // Remove physics body
            delete playerObjs[playerKeys[i]]; // Delete JS object
        }
    }
    let playerCount = Object.keys(players).length;

    // Update visual player count
    try {
        document.getElementById("playerCount").innerHTML = `${playerCount} player${(playerCount == 1 ? "" : "s")} connected`;
    } catch {
        // Headless Mode
    }
});

export function sendInfoToServer(objs) {
    // Data Compression:
    let objKeys = Object.keys(objs);
    let compressedObjs = {};
    for (let i = 0; i < objKeys.length; i++)
        compressedObjs[objKeys[i]] = objs[objKeys[i]].compress();

    socket.emit("simulationUpdate", compressedObjs);
}

export function createCpu(id) {
    socket.emit("createCpu", id);
}