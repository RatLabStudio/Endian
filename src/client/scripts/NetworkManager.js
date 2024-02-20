import { io } from "socket.io-client";
import * as THREE from 'three';
import { GameObject } from './classes/GameObject.js';

//const socket = io("http://10.226.241.67:3000");
const socket = io("http://localhost:3000");
let connected = false;

let player = null;
export let playerList = {}; // List of player objects shared with the server
let playerObjs = {};

socket.on("connect", () => {
    console.log(`Connected with ID: ${socket.id}`);
    player.networkId = socket.id;
    connected = true;
});

export function initialize(playerObj) {
    player = playerObj;
}

export function sendInfoToServer(player) {
    if (!connected)
        return;
    socket.emit("playerUpdate", player.networkObject.infoToSend);
}

function createPlayerObj(newPlayer) {
    playerObjs[newPlayer.networkId] = new GameObject(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0x00FFFF }),
        player.scene
    );
    playerObjs[newPlayer.networkId].position.set(
        newPlayer.position.x,
        newPlayer.position.y,
        newPlayer.position.z
    );
}

function removePlayerObj() {

}

function updatePlayerObjs() {
    let playersArr = Object.keys(playerList);
    let playerObjsArr = Object.keys(playerObjs);
    for (let i = 0; i < playerObjsArr.length; i++) {
        let p = playerList[playersArr[i]];
        let obj = playerObjs[p.networkId];
        if (obj == undefined)
            createPlayerObj(p);
        obj.position.set(
            p.position.x,
            p.position.y,
            p.position.z
        );
    }
    //console.log(playerList)
}

socket.on("playerClientUpdate", players => {
    let playersArr = Object.keys(players);
    for (let i = 0; i < playersArr.length; i++) {
        let p = players[playersArr[i]];
        if (p.networkId == socket.id)
            continue;
        playerList[p.networkId] = p;
    }
    updatePlayerObjs();
});