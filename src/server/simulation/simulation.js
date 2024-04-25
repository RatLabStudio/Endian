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

export let cpus = {};
cpus["cpu0"] = new NetworkObject("cpu0", "computer");
objects[cpus["cpu0"].id] = cpus["cpu0"];
cpus["cpu0"].object.position.set(0, -1, -20);
cpus["cpu0"].object.addToGame(game);
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

let t = -20;
setInterval(async function () {
    world.fixedStep(); // Update the physics world

    let objKeys = Object.keys(objects);
    for (let i = 0; i < objKeys.length; i++)
        objects[objKeys[i]].object.update();

    updateProjectiles();

    cpus["cpu0"].object.rotation.set(t, t, t);
    t += 0.0001;
}, 0);

/////////////////////////////////////////////


export function moveNetworkObjects(movedObjects) {
    for (let i = 0; i < movedObjects.length; i++) {
        if (objects[movedObjects[i].id] && objects[movedObjects[i].id].playerMovable) {
            objects[movedObjects[i].id].receiveMovementFromServer(movedObjects[i]);
        }
    }
};


/////////////// Projectiles ///////////////

export let projectiles = {};
let projectileSpeed = 1;

export function updateProjectiles() {
    let pKeys = Object.keys(projectiles);

    for (let i = 0; i < pKeys.length; i++) {
        let projectile = projectiles[pKeys[i]];

        if (!projectile.networkObject) { // If the projectile doesn't have a physics body
            projectile.networkObject = new NetworkObject(`projectile${pKeys[i]}`, "projectile"); // Physical object
            projectile.networkObject.object.position.copy(projectile.ray.origin);
            projectile.position = 0; // Position of the projectile on the ray
        }
    }
}

/////////////////////////////////////////////