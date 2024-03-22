import { io } from "socket.io-client";
import * as THREE from "three";
import * as CANNON from "cannon-es";

//const socket = io("http://10.226.241.85:3000");
const socket = io("http://localhost:3000");
//export let socket = io("http://192.168.1.254:3000");

socket.on("connect", () => {
    console.log(`Connected with ID: ${socket.id}`);
});

export function sendInfoToServer(objs) {
    // Data Compression:
    let objKeys = Object.keys(objs);
    let compressedObjs = {};
    for (let i = 0; i < objKeys.length; i++)
        compressedObjs[objKeys[i]] = objs[objKeys[i]].compress();

    socket.emit("recieveUpdatesFromSimulation", compressedObjs);
}