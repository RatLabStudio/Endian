// Endian Simulation - Rat Lab Studio 2024

import * as THREE from "three";
import * as CANNON from "cannon-es";

import * as Server from "../server.js";
import { NetworkObject } from "./objects/NetworkObject.js";

let scene = new THREE.Scene(); // This can be sent to a client later!

let world = new CANNON.World({
  //gravity: new CANNON.Vec3(0, -50, 0),
});
world.allowSleep = false;

export let game = {
  scene: scene,
  world: world,
};

export let objects = {};
export let cpus = {};

/////////////// Simulation Tick ///////////////

let t = 0;
setInterval(async function () {
  game.world.fixedStep(); // Update the physics world

  let objKeys = Object.keys(objects);
  for (let i = 0; i < objKeys.length; i++) objects[objKeys[i]].object.update();

  updateProjectiles();
  t += 0.0003;

  let cpuKeys = Object.keys(Server.cpus);
  for (let i = 0; i < cpuKeys.length; i++) {
    Server.cpus[cpuKeys[i]].update();
  }
}, 0);

/////////////////////////////////////////////

export function moveNetworkObjects(movedObjects) {
  for (let i = 0; i < movedObjects.length; i++) {
    if (objects[movedObjects[i].id] && objects[movedObjects[i].id].playerMovable) {
      objects[movedObjects[i].id].receiveMovementFromServer(movedObjects[i]);
    }
  }
}

/////////////// Projectiles ///////////////

export let projectiles = {};
let projectileSpeed = 1;

export function updateProjectiles() {
  let pKeys = Object.keys(projectiles);

  for (let i = 0; i < pKeys.length; i++) {
    let projectile = projectiles[pKeys[i]];

    if (!projectile.networkObject) {
      // If the projectile doesn't have a physics body
      projectile.networkObject = new NetworkObject(`projectile${pKeys[i]}`, "projectile"); // Physical object
      projectile.networkObject.object.position.copy(projectile.ray.origin);
      projectile.position = 0; // Position of the projectile on the ray
    }
  }
}

/////////////////////////////////////////////

/////////////// Simulation Management ///////////////

export function reset() {
  let scene = new THREE.Scene();
  let world = new CANNON.World({
    //gravity: new CANNON.Vec3(0, -50, 0),
    allowSleep: false,
  });
  game = {
    scene: scene,
    world: world,
  };

  objects = {};
  cpus = {};
  projectiles = {};

  setTimeout(function () {
    // Wait for player initialization
    let pKeys = Object.keys(Server.players);
    for (let i = 0; i < pKeys.length; i++) {
      //console.log(Server.players[pKeys[i]]);
      game.scene.add(Server.players[pKeys[i]].object.mesh);
      game.world.addBody(Server.players[pKeys[i]].object.body);
      Server.sendMessageToAllPlayers({
        message: `${Server.players[pKeys[i]].username} joined the game`,
        color: "lime",
      });
    }
  }, 500);

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
  cpus["cpu0"].object.position.set(-4, -1, -20);
  cpus["cpu0"].object.addToGame(game);
  cpus["cpu0"].playerMovable = true;

  cpus["cpu1"] = new NetworkObject("cpu1", "computer");
  objects[cpus["cpu1"].id] = cpus["cpu1"];
  cpus["cpu1"].object.position.set(0, -1, -20);
  cpus["cpu1"].object.addToGame(game);
  cpus["cpu1"].playerMovable = true;

  cpus["cpu2"] = new NetworkObject("cpu2", "computer");
  objects[cpus["cpu2"].id] = cpus["cpu2"];
  cpus["cpu2"].object.position.set(4, -1, -20);
  cpus["cpu2"].object.addToGame(game);
  cpus["cpu2"].playerMovable = true;

  setTimeout(() => {
    Server.createCpu(0);
    Server.cpus[0].gpu.displayImage("https://ratlabstudio.com/wp-content/uploads/2025/03/ratlabsite.png");

    Server.createCpu(1);
    Server.cpus[1].glitching = true;

    Server.createCpu(2);
    Server.cpus[2].gpu.nextLine();
    Server.cpus[2].gpu.printString("Simulation Running...");
    Server.cpus[2].gpu.nextLine();
  }, 1000);

  for (let i = 0; i < 10; i++) {
    let box = new NetworkObject("box" + i, "crate");
    objects[box.id] = box;
    box.playerMovable = true;
    box.object.position.y = i * 10;
    box.object.addToGame(game);
  }
}

reset();

/////////////////////////////////////////////
