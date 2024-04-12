import { io } from "socket.io-client";
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

import { NetworkObject } from "./classes/NetworkObject.js";
import { Computer } from "./classes/ComputerDisplay.js";
import * as Chat from "./chat.js";
import { ModelObject } from './classes/ModelObject.js';
import * as State from './state.js';
import * as UI from './ui.js';

//let ip = "localhost";
let ip = "65.32.118.97"; // Public Server
let socket = io(`http://${ip}:3000`);

// Make sure the client waits for player initialization to connect
State.setState("connecting_to_server");
socket.disconnect();
setTimeout(() => { socket.connect() }, 5000);
let connected = false;

let localPlayer = null; // The player on the local computer
export let playerList = {}; // List of players shared from the server
let lastPlayerList = {};
let playerObjs = {}; // List of physical player objects

export let objs = [];

export let cpuDisplays = {};

let justJoined = true;
setTimeout(function () { justJoined = false; }, 2000);

// Set the local player
export function initialize(playerObj) {
    localPlayer = playerObj;
}

socket.on("connect", () => {
    console.log(`Connected with ID: ${socket.id}`);
    localPlayer.networkId = socket.id;
    connected = true;
});

export function setOffline() {
    socket = io('http://localhost:3000');
}

// Sends only current player's info to the server
export function sendInfoToServer(player) {
    if (!connected)
        return;
    socket.emit("playerUpdate", player.infoToSend);
}

// Spawns new player object for a new payer
function createPlayerObj(newPlayer) {
    /*if (!justJoined)
        Chat.log(`${newPlayer.username} joined the game`, "yellow");*/

    playerObjs[newPlayer.networkId] = new ModelObject(
        'assets/model/player.gltf',
        new CANNON.Body({
            mass: 0,
            shape: new CANNON.Cylinder(0.6, 0.6, 1.5, 8)
        }),
        localPlayer.game
    );
    playerObjs[newPlayer.networkId].bodyOffset.y = -0.25;
}

// Removes a player entirely from the game
function removePlayerObj(playerNetId) {
    //Chat.log(`${playerObjs[playerNetId].username} left the game`, "yellow");

    let player = playerObjs[playerNetId]; // Player to be removed
    player.game.scene.remove(player.model); // Remove player model
    //player.material.dispose(); // Dispose of model texture
    player.game.world.removeBody(player.body); // Remove physics body
    delete playerObjs[playerNetId]; // Delete JS object
}

// Updates all player objects and creates new ones if necessary
function updatePlayerObjs() {
    let playersArr = Object.keys(playerList);
    let playerObjsArr = Object.keys(playerObjs);
    let updated = {};
    for (let i = 0; i < playersArr.length; i++) {
        let p = playerList[playersArr[i]];
        let obj = playerObjs[playerObjsArr[i]];
        // If no player object exists:
        if (obj == undefined) {
            createPlayerObj(p)
            return;
        }
        // Update Position
        obj.setPosition(
            p.position.x,
            p.position.y + 1,
            p.position.z
        );

        obj.setRotation(
            0,
            p.rotation._y - Math.PI / 2,
            0
        );

        updated[playersArr[i]] = true;
    }
    for (let i = 0; i < playerObjsArr.length; i++) {
        if (!updated[playerObjsArr[i]]) {
            removePlayerObj(playerObjsArr[i]);
            //Chat.log(`${lastPlayerList[playerObjsArr[i]].username} left the game`, "yellow");
        }
    }
}

// Receive information from the server about players
socket.on("playerClientUpdate", players => {
    lastPlayerList = playerList;
    playerList = {}; // Reset player list to delete old players
    let playersArr = Object.keys(players);
    for (let i = 0; i < playersArr.length; i++) {
        let p = players[playersArr[i]];
        if (p.networkId == socket.id) // Skip local player
            continue; // NOTE: Local Player is NOT stored in the player list
        playerList[playersArr[i]] = p; // Update player with new info from server
    }
    updatePlayerObjs(); // Update the physical objects to reflect info
});

socket.on("removePlayer", playerNetId => {
    let playerToRemove = playerList[playerNetId];
    removePlayerObj(playerToRemove);
});

let tps = 0;
let lastObjectUpdate = performance.now();
// When the server sends NetworkObject updates
socket.on("objectUpdates", updatedObjs => {
    let updatedObjKeys = Object.keys(updatedObjs);
    for (let i = 0; i < updatedObjKeys.length; i++) {
        let obj = objs[updatedObjKeys[i]];
        if (!obj) {
            // Create New Object
            objs[updatedObjKeys[i]] = new NetworkObject(updatedObjs[updatedObjKeys[i]].id, updatedObjs[updatedObjKeys[i]].resourceId);
            // Add object to client game
            localPlayer.game.scene.add(objs[updatedObjKeys[i]].object.mesh);
            localPlayer.game.world.addBody(objs[updatedObjKeys[i]].object.body);
        } else {
            // Update Existing Object
            objs[updatedObjKeys[i]].updateFromServer(updatedObjs[updatedObjKeys[i]]);
        }
    }
    if (State.currentState <= State.getStateId("loading_simulation"))
        setTimeout(function () { State.setState("ready") }, 1500);

    let currentTime = performance.now();
    tps = Math.round((1000 / (currentTime - lastObjectUpdate)));
    lastObjectUpdate = currentTime;
    //console.log(tps);
});

export function moveNetworkObject(id, position) {
    socket.emit("moveNetworkObject", { id, position });
}

// Request updates from the simulation
export function requestSimulationUpdate() {
    socket.emit("requestSimulationUpdate"); // Updates networked objects
    //socket.emit("requestRayDisplayInfo"); // Updates blaster rays
    //socket.emit("requestPlayerInfo", socket.id); // Gets info for the current player
    //socket.emit("requestNewChatMessages"); // Gets all new chat messages
    socket.emit("requestAllCpuData"); // Gets CPU Data
}

// CPU Functions:
let cpus = {};

socket.on("cpuUpdateAll", cpuData => {
    cpus = cpuData;
    let cpuKeys = Object.keys(cpus);

    for (let i = 0; i < cpuKeys.length; i++) {
        // If the CpuDisplay doesn't exist, create it, then update it
        if (!cpuDisplays[cpuKeys[i]]) {
            cpuDisplays[cpuKeys[i]] = new Computer(localPlayer.game, localPlayer.game.cssScene);
            let obj = objs[`cpu${cpuKeys[i]}`].object;

            // Position the CpuDisplay after is has been loaded
            setTimeout(function () {
                cpuDisplays[cpuKeys[i]].setPosition(obj.position.x, obj.position.y, obj.position.z + 0.3);
            }, 500);
        }

        // Update the display
        cpuDisplays[cpuKeys[i]].setDisplayFrom2DArray(cpus[cpuKeys].pixels);
    }
});

// Get the data for a specific CPU
export function getCpuData(cpuId) {
    return cpus[cpuId];
}

// Get the data for all CPUs
export function getAllCpuData() {
    return cpus;
}

// Request the data for every CPU from the server
export function requestCpuUpdate(cpuId) {
    socket.emit("requestCpuData", cpuId);
}

// When the server sends a CPU update
socket.on("cpuUpdate", cpuData => {
    cpus[cpuData.id] = cpuData;
});

// Sends CPU input to the server for processing
export function sendInputToCpu(cpuId, inputChar) {
    socket.emit("cpuInput", cpuId, inputChar);
}

document.addEventListener("keydown", function (e) {
    let k = e.key;
    if (localPlayer.typing)
        sendInputToCpu("0", k.toLowerCase());
});

export function shootRay(ray) {
    let rayToSend = {
        id: socket.id + "time" + performance.now().toFixed(3).replace(".", ""),
        sender: socket.id,
        ray: {
            origin: ray.origin,
            direction: ray.direction
        }
    };
    socket.emit("shootRay", rayToSend);
}

/*let displayRays = {};
socket.on("sendRayDisplayInfoToPlayers", newDisplayRays => {
    let newDisplayRayKeys = Object.keys(newDisplayRays);

    for (let i = 0; i < newDisplayRayKeys.length; i++) {
        if (!displayRays[newDisplayRayKeys[i]]) { // If the ray didn't already exist
            // Manage creating a new ray display here
            displayRays[newDisplayRayKeys[i]] = new NetworkObject(newDisplayRays[newDisplayRayKeys[i]].id, "bullet");
            displayRays[newDisplayRayKeys[i]].object.mesh.position.set(0, -1000, 0);
            localPlayer.game.scene.add(displayRays[newDisplayRayKeys[i]].object.mesh);
        }

        // Construct the ray from it's data
        let ray = new THREE.Ray(
            newDisplayRays[newDisplayRayKeys[i]].ray.origin,
            newDisplayRays[newDisplayRayKeys[i]].ray.direction,
        );

        // Get the new position of the bullet on the ray line
        let newPos = new THREE.Vector3();
        let oldPos = displayRays[newDisplayRayKeys[i]].object.mesh.position;
        ray.at(newDisplayRays[newDisplayRayKeys[i]].position, newPos)

        // Get the difference between the old position and the new position
        let difference = new THREE.Vector3(
            newPos.x - oldPos.x,
            newPos.y - oldPos.y,
            newPos.z - oldPos.z
        );

        // If the bullet is too far away, it will snap to the position it should be at
        let far = 900;
        if (Math.abs(difference.x) > far || Math.abs(difference.y) > far || Math.abs(difference.z) > far) {
            displayRays[newDisplayRayKeys[i]].object.mesh.position.copy(newPos);
            continue;
        }

        // Move the bullet towards the new position
        let speed = 0.5;
        displayRays[newDisplayRayKeys[i]].object.mesh.position.x += difference.x * speed;
        displayRays[newDisplayRayKeys[i]].object.mesh.position.y += difference.y * speed;
        displayRays[newDisplayRayKeys[i]].object.mesh.position.z += difference.z * speed;
    }

    // Delete old rays that are not in the new list
    let displayRayKeys = Object.keys(displayRays);
    for (let i = 0; i < displayRayKeys.length; i++) {
        if (!newDisplayRays[displayRayKeys[i]]) {
            localPlayer.game.scene.remove(displayRays[displayRayKeys[i]].object.mesh);
            delete displayRays[displayRayKeys[i]];
        }
    }
});

socket.on("playerInfoUpdate", playerInfo => {
    UI.setElement("health", playerInfo.health);
    if (playerInfo.health <= 0) {
        window.location.reload();
    }
});

let hasSentMessages = false;
socket.on("sendNewChatMessages", messages => {
    if (!hasSentMessages) {
        hasSentMessages = true;
        return;
    }
    for (let i = 0; i < messages.length; i++)
        Chat.log(messages[i].message, messages[i].color);
});*/