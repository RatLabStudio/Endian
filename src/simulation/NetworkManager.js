import { io } from "socket.io-client";

import * as Resources from './Resources.js';

let ip = "192.168.1.254" // Home PC
//let ip = "10.226.5.132"; // Tencza
//let ip = "localhost";
const socket = io(`http://${ip}:3000`);

let game = null;
export function initializeGame(newGame) {
    game = newGame;
}

export let players = {};
export let playerObjs = {};
export let playerInfo = {};
export let rays = [];

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
    socket.emit("requestMovedNetworkObjects");
    socket.emit("requestRays");
}

socket.on("playerSimulationUpdate", newPlayers => {
    let newPlayerKeys = Object.keys(newPlayers);
    for (let i = 0; i < newPlayerKeys.length; i++) {
        if (!players[newPlayerKeys[i]]) {
            // Create new player
            players[newPlayerKeys[i]] = newPlayers[newPlayerKeys[i]];
            playerObjs[players[newPlayerKeys[i]].networkId] = Resources.createObject("player");
            let playerObj = playerObjs[players[newPlayerKeys[i]].networkId];
            playerObj.mesh.name = "player" + newPlayerKeys[i];
            sendChatMessage(`${players[newPlayerKeys[i]].username} joined the game`, "yellow");

            let playerData = players[newPlayerKeys[i]];
            playerObj.body.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
            //playerObj.body.quaternion.set(playerData.quaternion.x, playerData.quaternion.y, playerData.quaternion.z, playerData.quaternion.w);
            game.scene.add(playerObj.mesh);
            game.world.addBody(playerObj.body);

            playerInfo[newPlayerKeys[i]] = {
                health: 100,
            };
        } else {
            // Update existing Player
            /*playerObjs[players[newPlayerKeys[i]].networkId].setPosition(
                newPlayers[newPlayerKeys[i]].position.x,
                newPlayers[newPlayerKeys[i]].position.y - 1,
                newPlayers[newPlayerKeys[i]].position.z
            );*/

            let oldPlayer = playerObjs[players[newPlayerKeys[i]].networkId];
            let newPlayer = newPlayers[newPlayerKeys[i]];
            let difference = {
                x: newPlayer.position.x - oldPlayer.position.x,
                y: newPlayer.position.y - oldPlayer.position.y + 0.25,
                z: newPlayer.position.z - oldPlayer.position.z,
            };

            oldPlayer.body.wakeUp();

            let acc = 50; // The rate that the player moves toward it's new location at
            oldPlayer.body.velocity.x = difference.x * acc;
            oldPlayer.body.velocity.y = difference.y * acc;
            oldPlayer.body.velocity.z = difference.z * acc;

            // Keep player from falling over
            oldPlayer.body.quaternion.x = 0;
            oldPlayer.body.quaternion.y = 0;
            oldPlayer.body.quaternion.z = 0;

            oldPlayer.update();
        }
    }

    // Remove players who have disconnected
    let playerKeys = Object.keys(players);
    for (let i = 0; i < playerKeys.length; i++) {
        if (!newPlayers[playerKeys[i]]) {
            sendChatMessage(`${players[playerKeys[i]].username} left the game`, "yellow")
            delete players[playerKeys[i]];
            let player = playerObjs[playerKeys[i]];
            game.scene.remove(player.mesh); // Remove player model
            player.material.dispose(); // Dispose of model texture
            game.world.removeBody(player.body); // Remove physics body
            delete playerObjs[playerKeys[i]]; // Delete JS object
            delete playerInfo[playerKeys[i]];
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

socket.on("movedNetworkObjects", movedObjects => {
    for (let i = 0; i < movedObjects.length; i++) {
        if (objs[movedObjects[i].id] && objs[movedObjects[i].id].playerMovable) {
            objs[movedObjects[i].id].receiveMovementFromServer(movedObjects[i]);
        }
    }
});

let objs;
export function sendInfoToServer(newObjs) {
    // Data Compression:
    objs = newObjs;
    let objKeys = Object.keys(newObjs);
    let compressedObjs = {};
    for (let i = 0; i < objKeys.length; i++)
        compressedObjs[objKeys[i]] = newObjs[objKeys[i]].compress();

    socket.emit("simulationUpdate", compressedObjs);
    socket.emit("sendPlayerInfo", playerInfo);
}

export function createCpu(id) {
    socket.emit("createCpu", id);
}

socket.on("sendRays", newRays => {
    rays = newRays;
});

export function sendRayDisplayInfo(raysToSend) {
    let rayKeys = Object.keys(raysToSend);
    let rayData = {};
    
    for (let i = 0; i < rayKeys.length; i++) {
        let currentRay = raysToSend[rayKeys[i]];
        rayData[rayKeys[i]] = {
            id: currentRay.id,
            sender: currentRay.sender,
            ray: {
                origin: currentRay.raycaster.ray.origin,
                direction: currentRay.raycaster.ray.direction
            },
            position: currentRay.position
        };
    }
    socket.emit("sendRayDisplayInfo", rayData);
}

export function sendChatMessage(message, color) {
    let messageData = {
        message: message,
        color: color
    };
    socket.emit("sendChatMessage", messageData);
}