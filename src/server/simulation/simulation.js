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

export let objects = {}; // All world GameObjects
export let cpus = {}; // Physical CPU Objects
export let cpuPairs = {}; // CPU Object and Simulated Computer Pair

/////////////// Simulation Tick ///////////////

setInterval(async function () {
  game.world.fixedStep(); // Update the physics world

  // Update all GameObjects
  let objKeys = Object.keys(objects);
  for (let i = 0; i < objKeys.length; i++) objects[objKeys[i]].object.update();

  // Update all CPUs
  let cpuKeys = Object.keys(Server.cpus);
  for (let i = 0; i < cpuKeys.length; i++) {
    try {
      Server.cpus[cpuKeys[i]].update();
    } catch (e) {
      Server.cpus[cpuKeys[i]].displayError(e);
    }
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

export let currentRayPositions = {};

// Manages all rays
function updateRays() {
  let rayKeys = Object.keys(Server.activeRays);
  for (let i = 0; i < rayKeys.length; i++) {
    let currentRay = Server.activeRays[rayKeys[i]];
    currentRay.distanceTraveled += 0.25; // Will probably add delta time here

    // Reconstruct the ray for server use
    let threeRay = new THREE.Ray(currentRay.ray.origin, currentRay.ray.direction);

    // Prepare data for clients
    currentRayPositions[rayKeys[i]] = {
      position: new THREE.Vector3(),
      direction: currentRay.ray.direction,
    };
    threeRay.at(currentRay.distanceTraveled, currentRayPositions[rayKeys[i]].position);

    // Set general use raycaster for this ray
    let cRay = new CANNON.Ray();
    cRay.from.set(currentRay.ray.origin.x, currentRay.ray.origin.y, currentRay.ray.origin.z);

    // Set the endpoint of the ray for Cannon
    let endPoint = new THREE.Vector3();
    threeRay.at(100, endPoint);
    cRay.to.set(endPoint.x, endPoint.y, endPoint.z);

    let closestIntersect = null; // First object the ray hits
    let intersects = []; // All objects the ray hits

    // Cycle through every game object
    for (let i = 0; i < game.world.bodies.length; i++) {
      // Ensure the sender of the ray cannot be hit by the ray
      if (!Server.players[currentRay.sender] || game.world.bodies[i].id == Server.players[currentRay.sender].object.body.id) continue;

      let intersect = new CANNON.RaycastResult();
      cRay.intersectBody(game.world.bodies[i], intersect); // Check for intersection between ray and object

      // Add the intersect to the list if it hits
      if (intersect.hasHit) intersects.push(intersect);
    }

    // Sort the intersections by distance (closest first)
    intersects.sort((a, b) => a.distance - b.distance);

    if (intersects.length > 0) {
      closestIntersect = intersects[0];

      // Bullet travel
      if (closestIntersect.distance > currentRay.distanceTraveled - 0.25 && closestIntersect.distance < currentRay.distanceTraveled + 0.25) {

        // If the ray hits a player
        if (Server.playerBodyIds[closestIntersect.body.id]) {
          Server.playerInfo[Server.playerBodyIds[closestIntersect.body.id]].health -= 10; // Take health away from target
          if (Server.playerInfo[Server.playerBodyIds[closestIntersect.body.id]].health <= 0)
            // Chat message
            Server.sendMessageToAllPlayers({
              message: `${Server.players[Server.playerBodyIds[closestIntersect.body.id]].username} was killed by ${Server.players[currentRay.sender].username}`,
              color: "orange",
            });
        }

        // If the ray hits a generic object
        else {
          // Apply a force the object following the impulse direction of the ray
          closestIntersect.body.applyImpulse(new CANNON.Vec3(currentRay.ray.direction.x * 1000, currentRay.ray.direction.y * 1000, currentRay.ray.direction.z * 1000), endPoint);
          closestIntersect.body.applyTorque(new CANNON.Vec3(currentRay.ray.direction.x * 1000, currentRay.ray.direction.y * 1000, currentRay.ray.direction.z * 1000));
        }

        // Delete the ray after it hits something
        delete Server.activeRays[rayKeys[i]];
        delete currentRayPositions[rayKeys[i]];
        continue;
      }
    }

    // Rays delete after travelling too far
    if (currentRay.distanceTraveled > 100) {
      delete Server.activeRays[rayKeys[i]];
      delete currentRayPositions[rayKeys[i]];
      continue;
    }
  }
}

/////////////////////////////////////////////

// Creates a CPU physical object and screen pair
function createNewCpu(id = Object.keys(cpus).length, position = new THREE.Vector3(0, 0, 0), initialFunction) {
  cpus[`cpu${id}`] = new NetworkObject(`cpu${id}`, "computer"); // Create the physical object
  objects[cpus[`cpu${id}`].id] = cpus[`cpu${id}`]; // Add the object to the object list
  cpus[`cpu${id}`].object.position.set(position.x, position.y, position.z); // Relocate the CPU
  cpus[`cpu${id}`].object.addToGame(game);
  cpus[`cpu${id}`].playerMovable = true; // CPUs are movable by players by default

  // Create the simulated CPU
  setTimeout(() => {
    Server.createCpu(id);

    cpuPairs[id] = {
      networkObject: cpus[`cpu${id}`],
      simulatedCpu: Server.cpus[id]
    };

    // Allows the CPU to run a function upon starting
    try {
      if (initialFunction)
        initialFunction(id);
    } catch (e) { // Handles errors within the starting function
      Server.cpus[id].displayError(e);
    }
  }, 1000);
}

/////////////// Start of Program ///////////////

function spawnBasicObjects() {
  let floor = new NetworkObject("floor", "floor");
  objects[floor.id] = floor;
  floor.object.position.set(0, -5, 0);
  floor.object.addToGame(game);

  createNewCpu(0, new THREE.Vector3(-4, -1, -20), (id) => { Server.cpus[id].gpu.displayImage("https://ratlabstudio.com/wp-content/uploads/2025/03/ratlabsite.png"); });
  createNewCpu(1, new THREE.Vector3(0, -1, -20), (id) => { Server.cpus[id].glitching = true; });
  createNewCpu(2, new THREE.Vector3(4, -1, -20), (id) => {
    Server.cpus[id].gpu.nextLine();
    Server.cpus[id].gpu.printString("Simulation Running...");
    Server.cpus[id].gpu.nextLine();
  });

  // Floating Crates:
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
