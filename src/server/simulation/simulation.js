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

setInterval(async function () {
  game.world.fixedStep(); // Update the physics world

  let objKeys = Object.keys(objects);
  for (let i = 0; i < objKeys.length; i++) objects[objKeys[i]].object.update();

  let cpuKeys = Object.keys(Server.cpus);
  for (let i = 0; i < cpuKeys.length; i++) {
    Server.cpus[cpuKeys[i]].update();
  }

  updateRays();
}, 0);

/////////////////////////////////////////////

export function moveNetworkObjects(movedObjects) {
  for (let i = 0; i < movedObjects.length; i++) {
    if (objects[movedObjects[i].id] && objects[movedObjects[i].id].playerMovable) {
      objects[movedObjects[i].id].receiveMovementFromServer(movedObjects[i]);
    }
  }
}

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

/////////////// Rays ///////////////

let raycaster = new THREE.Raycaster();

function updateRays() {
  let rayKeys = Object.keys(Server.activeRays);
  for (let i = 0; i < rayKeys.length; i++) {
    let currentRay = Server.activeRays[rayKeys[i]];
    currentRay.distanceTraveled += 0.1; // Will probably add delta time here

    /* {
  ray: {
    origin: {
      x: 3.0000000000000004,
      y: 0.141411792161943,
      z: 4.000000000000001
    },
    direction: {
      x: 0.04254678920122486,
      y: -0.6650046169718703,
      z: -0.7456263341210279
    }
  },
  sender: '9eofZpJuQeIbfYESAAAC',
  distanceTraveled: 100.09999999999859
} */

    // Set general use raycaster for this ray
    raycaster.set(currentRay.ray.origin, currentRay.ray.direction);

    let intersects = [];
    raycaster.intersectObjects(game.scene.children, true, intersects);
    /*if (intersects.length > 0)
      console.log(intersects);*/

    // Rays delete after travelling too far
    if (currentRay.distanceTraveled > 100) {
      delete Server.activeRays[rayKeys[i]];
      continue;
    }
  }
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
