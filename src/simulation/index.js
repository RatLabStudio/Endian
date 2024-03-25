import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from 'cannon-es-debugger';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import * as NetworkManager from './NetworkManager.js';
import { NetworkObject } from "./NetworkObject.js";

// Headless mode is for when you want to run the simulation in the terminal without a display window
let headless = false;

// FPS Counter Creation
let stats
try {
  stats = new Stats();
  document.body.append(stats.dom);
} catch {
  headless = true;
}

let scene = new THREE.Scene();

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -50, 0)
});
world.allowSleep = false;

let game = {
  scene: scene,
  world: world
};
NetworkManager.initializeGame(game);

const cannonDebugger = new CannonDebugger(scene, world, {});

let controls, renderer, camera;
if (!headless) {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  camera.position.set(-25, 5, -25);
  camera.lookAt(0, 0, 0)
  controls.update();

  window.addEventListener('resize', function () {
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  let sun = new THREE.AmbientLight(0xFFFFFF, 1);
  scene.add(sun);
}

let objs = {};

let test = new NetworkObject("testBox", "box");
objs[test.id] = test;
test.object.addToGame(game);

let floor = new NetworkObject("floor", "floor");
objs[floor.id] = floor;
floor.object.position.set(0, -5, 0);
floor.object.addToGame(game);

let cpu = new NetworkObject("cpu0", "computer");
objs[cpu.id] = cpu;
cpu.object.position.set(0, -1, -20);
cpu.object.addToGame(game);
NetworkManager.createCpu(0);

/*let cpu2 = new NetworkObject("cpu1", "computer");
objs[cpu2.id] = cpu2;
cpu2.object.position.set(0, -4, -20);
cpu2.object.addToGame(game);
NetworkManager.createCpu(1);*/

let previousTime = performance.now();
setInterval(function () {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000; // Delta Time

  world.fixedStep(); // Update the physics world

  cannonDebugger.update();

  let objKeys = Object.keys(objs);
  for (let i = 0; i < objKeys.length; i++)
    objs[objKeys[i]].object.update();

  NetworkManager.requestPlayerUpdates();

  if (!headless) {
    stats.update(); // FPS Counter
    controls.update();
    renderer.render(scene, camera);
  }

  NetworkManager.sendInfoToServer(objs);

  previousTime = currentTime;
}, 1)