// Endian Simulation
// Rat Lab Studio 2024

// IMPORTANT: If you are in view mode, you must have the tab open for the simulation to tick properly!!!

import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from 'cannon-es-debugger';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import * as NetworkManager from './NetworkManager.js';
import { NetworkObject } from "./NetworkObject.js";

import * as Resources from './Resources.js';

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
} else {
  camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 1000);
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

  createRenderer({ width: 1920, height: 1080 });
}

let objs = {};

/*let test = new NetworkObject("testBox", "box");
objs[test.id] = test;
test.playerMovable = true;
test.object.addToGame(game);*/

let floor = new NetworkObject("floor", "floor");
objs[floor.id] = floor;
floor.object.position.set(0, -5, 0);
floor.object.addToGame(game);

/*let ball = new NetworkObject("ball", "ball");
objs[ball.id] = ball;
ball.object.position.set(0, 10, 0);
ball.playerMovable = true;
ball.object.addToGame(game);*/

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

let rays = {};
let raySpeed = 0.05;
let hitBoxOffset = 0.5;
let maxRayDistance = 100;

function manageRays() {
  for (let i = 0; i < NetworkManager.rays.length; i++) {
    if (!NetworkManager.playerObjs[NetworkManager.rays[i].sender])
      return;

    if (!rays[NetworkManager.rays[i].id]) {
      // Store the ray for updating
      rays[NetworkManager.rays[i].id] = NetworkManager.rays[i];
      rays[NetworkManager.rays[i].id].position = 0;

      // Reconstruct the ray with the provided data
      let reconstructedRaycaster = new THREE.Raycaster(
        new THREE.Vector3(
          rays[NetworkManager.rays[i].id].ray.origin.x,
          rays[NetworkManager.rays[i].id].ray.origin.y,
          rays[NetworkManager.rays[i].id].ray.origin.z
        ),
        new THREE.Vector3(
          rays[NetworkManager.rays[i].id].ray.direction.x,
          rays[NetworkManager.rays[i].id].ray.direction.y,
          rays[NetworkManager.rays[i].id].ray.direction.z
        )
      );

      //reconstructedRaycaster.ray.origin.y += 1; // Account for camera offset
      rays[NetworkManager.rays[i].id].raycaster = reconstructedRaycaster;

      //scene.add(new THREE.ArrowHelper(rays[NetworkManager.rays[i].id].raycaster.ray.direction, rays[NetworkManager.rays[i].id].raycaster.ray.origin, 300, 0xFF0000));
    }
  }
}

function updateRays() {
  let rayKeys = Object.keys(rays);
  for (let i = 0; i < rayKeys.length; i++) {
    try {
      rays[rayKeys[i]].position += raySpeed;
    }
    catch {
      console.error(`Unable to set position of ray ${rayKeys[i]}`);
      return;
    }

    // Kill the ray if it gets too far away
    if (rays[rayKeys[i]].position > maxRayDistance) {
      delete rays[rayKeys[i]];
      NetworkManager.sendRayDisplayInfo(rays);
      return;
    }

    // Check if ray hits an object at it's current position
    let intersections = rays[rayKeys[i]].raycaster.intersectObjects(scene.children);
    //console.log(intersections);
    for (let i = 0; i < intersections.length; i++) {
      // See if the ray at its distance is within the bounds of the intersected object
      if (rays[rayKeys[i]] && intersections[i].distance < rays[rayKeys[i]].position + hitBoxOffset && intersections[i].distance > rays[rayKeys[i]].position - hitBoxOffset) {
        if (intersections[i].object.name == '')
          continue; // Continue to next intersection

        let shotPlayer = NetworkManager.players[intersections[i].object.name.replace("player", "")];
        if (shotPlayer) {
          NetworkManager.playerInfo[shotPlayer.networkId].health -= 5;
          if (NetworkManager.playerInfo[shotPlayer.networkId].health <= 0)
            NetworkManager.sendChatMessage(`${shotPlayer.username} was killed by ${NetworkManager.players[rays[rayKeys[i]].sender].username}`, "white");
          //console.log(`${NetworkManager.players[rays[rayKeys[i]].sender].username} shot ${shotPlayer.username}`)
        } else {
          //console.log(`${NetworkManager.players[rays[rayKeys[i]].sender].username} HIT ${intersections[i].object.name}`);
        }

        delete rays[rayKeys[i]];
        break;
      }
    }
  }

  NetworkManager.sendRayDisplayInfo(rays);
}

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

  manageRays();
  updateRays();

  if (renderer) {
    if (!headless) {
      stats.update(); // FPS Counter
      controls.update();
    }
    renderer.render(scene, camera);
  }

  NetworkManager.sendInfoToServer(objs);

  previousTime = currentTime;
}, 1);