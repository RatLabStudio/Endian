// Endian Simulation - Rat Lab Studio 2024

import * as THREE from "three";
import * as CANNON from "cannon-es";

import * as Server from '../server.js';
import { NetworkObject } from "./objects/NetworkObject.js";

let scene = new THREE.Scene(); // This can be sent to a client later!

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -50, 0)
});
world.allowSleep = false;

export let game = {
    scene: scene,
    world: world
};

/////////////// Start of Program ///////////////

export let objects = {};

let floor = new NetworkObject("floor", "floor");
objects[floor.id] = floor;
floor.object.position.set(0, -5, 0);
floor.object.addToGame(game);

let cpu = new NetworkObject("cpu0", "computer");
objects[cpu.id] = cpu;
cpu.object.position.set(0, -1, -20);
cpu.object.addToGame(game);
setTimeout(() => { Server.createCpu(0) }, 1000);

for (let i = 0; i < 10; i++) {
    setTimeout(() => {
        let box = new NetworkObject("box" + i, "box");
        objects[box.id] = box;
        box.playerMovable = true;
        box.object.position.y = i * 10;
        box.object.addToGame(game);
    }, 500 * i);
}

/////////////////////////////////////////////


/////////////// Simulation Tick ///////////////

setInterval(async function () {
    world.fixedStep(); // Update the physics world

    let objKeys = Object.keys(objects);
    for (let i = 0; i < objKeys.length; i++)
        objects[objKeys[i]].object.update();
}, 0);

/////////////////////////////////////////////


export function moveNetworkObjects(movedObjects) {
    for (let i = 0; i < movedObjects.length; i++) {
        if (objects[movedObjects[i].id] && objects[movedObjects[i].id].playerMovable) {
            objects[movedObjects[i].id].receiveMovementFromServer(movedObjects[i]);
        }
    }
};