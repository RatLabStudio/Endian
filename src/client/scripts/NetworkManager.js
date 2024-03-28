import { io } from "socket.io-client";
import * as CANNON from 'cannon-es';

import { NetworkObject } from "./classes/NetworkObject.js";
import { Computer } from "./classes/ComputerDisplay.js";
import * as Chat from "./chat.js";
import { ModelObject } from './classes/ModelObject.js';
import * as State from './state.js';

//let ip = "10.226.5.132"; // Tencza
let ip = "localhost";
let socket = io(`http://${ip}:3000`);

// Make sure the client waits for player initialization to connect
State.setState("connecting_to_server");
socket.disconnect();
setTimeout(() => {socket.connect()}, 1000);
let connected = false;

let localPlayer = null; // The player on the local computer
export let playerList = {}; // List of players shared from the server
let playerObjs = {}; // List of physical player objects

export let objs = [];

export let cpuDisplays = {};

let justJoined = true;
setTimeout(function () { justJoined = false; }, 1000);

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
    if (!justJoined)
        Chat.log(`${newPlayer.networkId} joined the game`, "yellow");

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
    Chat.log(`${playerNetId} left the game`, "yellow");

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
            p.position.y,
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
        if (!updated[playerObjsArr[i]])
            removePlayerObj(playerObjsArr[i]);
    }
}

// Receive information from the server about players
socket.on("playerClientUpdate", players => {
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
});

// Request updates from the simulation
export function requestSimulationUpdate() {
    socket.emit("requestSimulationUpdate");
}

// CPU Functions:
let cpus = {};

export function requestAllCpuUpdates() {
    socket.emit("requestAllCpuData");
}

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