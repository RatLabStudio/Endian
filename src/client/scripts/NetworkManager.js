import { io } from "socket.io-client";
import * as THREE from 'three';
import { GameObject } from './classes/GameObject.js';

const socket = io("http://10.226.241.85:3000");
//const socket = io("http://localhost:3000");
let connected = false;

let localPlayer = null; // The player on the local computer
export let playerList = {}; // List of players shared from the server
let playerObjs = {}; // List of physical player objects

socket.on("connect", () => {
    console.log(`Connected with ID: ${socket.id}`);
    localPlayer.networkObject.networkId = socket.id;
    connected = true;
});

// Set the local player
export function initialize(playerObj) {
    localPlayer = playerObj;
}

// Sends only current player's info to the server
export function sendInfoToServer(player) {
    if (!connected)
        return;
    socket.emit("playerUpdate", player.networkObject.infoToSend);
}

// Spawns new player object for a new payer
function createPlayerObj(newPlayer) {
    playerObjs[newPlayer.networkId] = new GameObject(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0x00FFFF }),
        localPlayer.scene
    );
    playerObjs[newPlayer.networkId].mesh.position.set(
        newPlayer.position.x,
        newPlayer.position.y,
        newPlayer.position.z
    );
}

function removePlayerObj(playerNetId) {
    let player = playerObjs[playerNetId];
    player.scene.remove(player.mesh);
    player.material.dispose();
    delete playerObjs[playerNetId];
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
        obj.mesh.position.set(
            p.position.x,
            p.position.y,
            p.position.z
        );
        // Update Rotation
        obj.mesh.rotation.set(
            p.rotation.x,
            p.rotation.y,
            p.rotation.z
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
        playerList[playersArr[i]] = p; // Update player with neew info from server
    }
    updatePlayerObjs(); // Update the physical objects to reflect info
});

socket.on("removePlayer", playerNetId => {
    console.log(`Deleting player ${playerNetId}`);
    let playerToRemove = playerList[playerNetId];
    removePlayerObj(playerToRemove);
});