// Endian Simulation
// Rat Lab Studio 2024

// IMPORTANT: If you are in view mode, you must have the tab open for the simulation to tick properly!!!

import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from 'cannon-es-debugger';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import * as NetworkManager from './SimManager.js';
import { NetworkObject } from "./NetworkObject.js";
import * as Rays from './rays.js';
import { VoxelObject } from "./VoxelObject.js";

import * as Server from '../server.js';

//import { gl } from "gl"; // FOR VIEW MODE
import gl from "gl";     // FOR HEADLESS MODE

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

console.log(`Running in ${headless ? 'headless' : 'view'} mode`);

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

let canvas, controls, renderer, camera;

/////////////// View Mode Config ///////////////
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

/////////////// Headless Mode Config ///////////////
else {
  /*camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 1000);
  function createRenderer({ height, width }) {
    // THREE expects a canvas object to exist, but it doesn't actually have to work.
    canvas = {
      width,
      height,
      addEventListener: event => { },
      removeEventListener: event => { },
    };

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
      context: gl(width, height, {
        preserveDrawingBuffer: true,
      }),
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default PCFShadowMap

    // This is important to enable shadow mapping. For more see:
    // https://threejsfundamentals.org/threejs/lessons/threejs-rendertargets.html and
    // https://threejsfundamentals.org/threejs/lessons/threejs-shadows.html
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    renderer.setRenderTarget(renderTarget);
    return renderer;
  }

  createRenderer({ width: 1920, height: 1080 });*/
}


/////////////// Start of Program ///////////////

export let objs = {};

let floor = new NetworkObject("floor", "floor");
objs[floor.id] = floor;
floor.object.position.set(0, -5, 0);
floor.object.addToGame(game);

let cpu = new NetworkObject("cpu0", "computer");
objs[cpu.id] = cpu;
cpu.object.position.set(0, -1, -20);
cpu.object.addToGame(game);
NetworkManager.createCpu(0);

for (let i = 0; i < 10; i++) {
  let box = new NetworkObject("box" + i, "box");
  objs[box.id] = box;
  box.playerMovable = true;
  box.object.position.y = i * 10;
  box.object.addToGame(game);
}

let tps = 0;
let previousTime = performance.now();
setInterval(async function () {
  let currentTime = performance.now();
  tps = Math.round((1000 / (currentTime - previousTime)));
  let dt = (currentTime - previousTime) / 1000; // Delta Time

  world.fixedStep(); // Update the physics world

  cannonDebugger.update();

  let objKeys = Object.keys(objs);
  for (let i = 0; i < objKeys.length; i++)
    objs[objKeys[i]].object.update();

  NetworkManager.playerSimulationUpdate(Server.players);

  await Rays.manageRays();
  await Rays.updateRays(scene);

  if (renderer) {
    if (!headless) {
      stats.update(); // FPS Counter
      controls.update();
    }
    renderer.render(scene, camera);
  }

  NetworkManager.sendInfoToServer(objs);

  previousTime = currentTime;
}, 0);