// Endian Simulation - Rat Lab Studio 2024

import * as THREE from "three";
import * as CANNON from "cannon-es";

import * as Server from '../server.js';
import { NetworkObject } from "./objects/NetworkObject.js";
import { VoxelObject } from "./objects/VoxelObject.js";

let scene = new THREE.Scene(); // This can be sent to a client later!

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -50, 0)
});
world.allowSleep = false;

export let game = {
    scene: scene,
    world: world
};

export let objects = {};
export let cpus = {};
export let voxelObjects = {};

/*voxelObjects.voTest = new VoxelObject(game, "voTest");
voxelObjects.voTest.setPosition(new THREE.Vector3(0, 5, -10));

let matrix = [];
let size = 20;
for (let x = 0; x < size; x++) {
    matrix.push([]);
    for (let y = 0; y < size; y++) {
        matrix[x].push([]);
        for (let z = 0; z < size; z++) {
            matrix[x][y][z] = "air";
        }
    }
}
function setCoords(pos, value) {
    matrix[pos[0]][pos[1]][pos[2]] = value;
}

for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
            if (j % 2 == 0) {
                if (i % 2 == 0 && k % 2 == 0)
                    setCoords([i, j, k], "box");
            } else {
                if (i % 2 != 0 && k % 2 != 0)
                    setCoords([i, j, k], "box");
            }
        }
    }
}

voxelObjects.voTest.setMatrixFromIds(matrix);
voxelObjects.voTest.body.mass = 1000;
//voxelObjects.voTest.body.sleep();
//voxelObjects.voTest.body.velocity.y = 10;*/


/////////////// Simulation Tick ///////////////

let t = 0;
setInterval(async function () {
    game.world.fixedStep(); // Update the physics world

    let objKeys = Object.keys(objects);
    for (let i = 0; i < objKeys.length; i++)
        objects[objKeys[i]].object.update();

    updateProjectiles();

    //cpus["cpu0"].object.rotation.set(t, t, t);
    //voxelObjects.voTest.setRotation(new CANNON.Vec3(t, t, t));
    //voxelObjects.voTest.position.y -= 0.001;
    //voxelObjects.voTest.body.velocity.y = 0.001;
    t += 0.0003;
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


/////////////// Simulation Management ///////////////

export function reset() {
    game = {
        scene: new THREE.Scene(),
        world: new CANNON.World({ gravity: new CANNON.Vec3(0, -50, 0), allowSleep: false })
    };

    objects = {};
    cpus = {};
    voxelObjects = {};
    projectiles = {};

    spawnBasicObjects();
}

/////////////////////////////////////////////


/////////////// Start of Program ///////////////

function spawnBasicObjects() {
    let floor = new NetworkObject("floor", "floor");
    objects[floor.id] = floor;
    floor.object.position.set(0, -5, 0);
    floor.object.addToGame(game);

    cpus["cpu0"] = new NetworkObject("cpu0", "computer");
    objects[cpus["cpu0"].id] = cpus["cpu0"];
    cpus["cpu0"].object.position.set(0, -1, -20);
    cpus["cpu0"].object.addToGame(game);
    setTimeout(() => { Server.createCpu(0) }, 1000);

    for (let i = 0; i < 10; i++) {
        let box = new NetworkObject("box" + i, "box");
        objects[box.id] = box;
        box.playerMovable = true;
        box.object.position.y = i * 10;
        box.object.addToGame(game);
    }
}

reset();

/////////////////////////////////////////////