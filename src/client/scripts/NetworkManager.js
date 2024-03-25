import { io } from "socket.io-client";
import * as THREE from 'three';
import { GameObject } from './classes/GameObject.js';
import * as CANNON from 'cannon-es';
import { NetworkObject } from "./classes/NetworkObject.js";
import { Computer } from "./classes/ComputerDisplay.js";
import * as Chat from "./chat.js";
import { ModelObject } from './classes/ModelObject.js';

//const socket = io("http://10.226.241.85:3000");
const socket = io("http://10.226.5.132:3000");
//export let socket = io("http://192.168.1.254:3000");
let connected = false;

let localPlayer = null; // The player on the local computer
export let playerList = {}; // List of players shared from the server
let playerObjs = {}; // List of physical player objects

export let objs = [];

export let cpuDisplays = {};

let justJoined = true;
setTimeout(function () { justJoined = false; }, 1000);

socket.on("connect", () => {
    console.log(`Connected with ID: ${socket.id}`);
    localPlayer.networkId = socket.id;
    connected = true;
});

export function setOffline() {
    socket = io('http://localhost:3000');
}

// Set the local player
export function initialize(playerObj) {
    localPlayer = playerObj;
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
        //Chat.log(`${newPlayer.networkId} joined the game`, "yellow");

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
    //Chat.log(`${playerNetId} left the game`, "yellow");
    let player = playerObjs[playerNetId]; // Player to be removed
    player.game.scene.remove(player.mesh); // Remove player model
    player.material.dispose(); // Dispose of model texture
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
});

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
        if (!cpuDisplays[cpuKeys[i]]) {
            cpuDisplays[cpuKeys[i]] = new Computer(localPlayer.game, localPlayer.game.cssScene);
            let obj = objs[`cpu${cpuKeys[i]}`].object;
            setTimeout(function () {
                cpuDisplays[cpuKeys[i]].setPosition(obj.position.x, obj.position.y, obj.position.z + 0.3);
                cpuDisplays[cpuKeys[i]].setDisplayFrom2DArray(cpus[cpuKeys].pixels);
            }, 100);
        } else {
            cpuDisplays[cpuKeys[i]].setDisplayFrom2DArray(cpus[cpuKeys].pixels);
        }
    }
});

export function getAllCpuData() {
    return cpus;
}

export function requestCpuUpdate(cpuId) {
    socket.emit("requestCpuData", cpuId);
}

socket.on("cpuUpdate", cpuData => {
    cpus[cpuData.id] = cpuData;
});

export function getCpuData(cpuId) {
    return cpus[cpuId];
}

export function sendInputToCpu(cpuId, inputChar) {
    socket.emit("cpuInput", cpuId, inputChar);
}

document.addEventListener("keydown", function (e) {
    let k = e.key;
    if (localPlayer.typing)
        sendInputToCpu("0", k.toLowerCase());
});