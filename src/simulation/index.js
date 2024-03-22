import * as THREE from "three";
import * as CANNON from "cannon-es";

import * as NetworkManager from './NetworkManager.js';
import { GameObject } from "./GameObject.js";
import { NetworkObject } from "./NetworkObject.js";

let scene = new THREE.Scene();

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -50, 0)
});
world.allowSleep = true;

let game = {
  scene: scene,
  world: world
};

let objs = {};

let test = new NetworkObject("testBox", "box");
objs[test.id] = test;

NetworkManager.sendInfoToServer(objs);

let previousTime = performance.now();
setInterval(function () {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000; // Delta Time

  world.fixedStep(); // Update the physics world

  //NetworkManager.sendInfoToServer(player);

  previousTime = currentTime;
}, 1);