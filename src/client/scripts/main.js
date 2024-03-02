// Endian Alpha v5
// Copyright Rat Lab Studio 2024

// Version Information
import { info } from './versionInfo.js';
document.getElementById("versionInfo").innerHTML = `${info.name} ${info.version}`;

// Importing Engine Classes
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

// Importing Supporting Game Classes
import { GameObject } from './classes/GameObject.js';
import { Player } from './classes/Player.js';
import * as NetworkManager from './NetworkManager.js';
import { Voxel } from './classes/Voxel.js';
import * as Lighting from './lighting.js';

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -30, 0)
});
world.allowSleep = true;

// Three.js Scene
const scene = new THREE.Scene();

const game = {
  scene: scene,
  world: world
};

// Camera and Player
const player = new Player(game);
player.setPosition(
  Math.round(Math.random() * 20 - 10),
  2,
  Math.round(Math.random() * 20 - 10)
);

const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

// FPS Counter Creation
const stats = new Stats();
document.body.append(stats.dom);

// Setting up the sky:
const loader = new THREE.CubeTextureLoader();
loader.setPath('assets/textures/sky/');
const textureCube = loader.load([
  'sky.jpg', 'sky.jpg',
  'sky.jpg', 'sky.jpg',
  'sky.jpg', 'sky.jpg'
]);
scene.background = textureCube;

Lighting.setupLights(game);

let ground = new Voxel({ x: 60, y: 5, z: 60 }, 0, new THREE.MeshLambertMaterial({ color: 0xB6B6B6 }), game);
ground.setPosition(0, -5, 0);

let test = new Voxel({ x: 1, y: 1, z: 1 }, 1, new THREE.MeshLambertMaterial({ color: 0x00FFFF }), game);
test.setPosition(0, 2, -10);
const cannonDebugger = new CannonDebugger(scene, world, {});

document.addEventListener("keydown", function (e) {
  let k = e.key;
  if (k == "Escape") {
    e.preventDefault();
    console.log("Escape");
    document.getElementById('settingsPanel').style.visibility = 'hidden';
    document.getElementById("pauseMenu").style.visibility = "hidden";
    //setPause(false);
  }
});

// Detect when the user leaves pointerLock
document.addEventListener("pointerlockchange", function (e) {
  if (!player.controls.isLocked)
    setPause(true);
});

// Displays pause menu and handles pointerlock
function setPause(state) {
  if (state) {
    document.getElementById("pauseMenu").style.visibility = "unset";
  } else {
    player.lockControls();
    document.getElementById("pauseMenu").style.visibility = "hidden";
  }
}
window.setPause = setPause;

// Game Loop
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000; // Delta Time
  requestAnimationFrame(animate);

  world.fixedStep(); // Update the physics world
  //cannonDebugger.update(); // Display the physics world

  test.update(); // This will later be done to all objects

  player.update(dt);

  stats.update(); // FPS Counter

  NetworkManager.sendInfoToServer(player);
  let playerCount = Object.keys(NetworkManager.playerList).length + 1;
  document.getElementById("playerCount").innerHTML = `${playerCount} player${(playerCount == 1 ? "" : "s")} connected`;
  document.getElementById("netId").innerHTML = `${player.networkObject.networkId}`;

  renderer.render(scene, player.camera);
  previousTime = currentTime;
}
animate();

// Adjusts cameras when the window is resized
window.addEventListener('resize', () => {
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setPixelRatio(1);

NetworkManager.initialize(player);