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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

// Importing Supporting Game Classes
import { Player } from './classes/Player.js';
import * as NetworkManager from './NetworkManager.js';
import { Voxel } from './classes/Voxel.js';
import * as GUI from './hand.js';
import * as Settings from './settings.js';
import { Computer } from './classes/ComputerDisplay.js';
import * as Lighting from './classes/Lighting.js';

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -50, 0)
});
world.allowSleep = true;

// GUI Scene
const guiScene = new THREE.Scene();
const guiCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
const guiRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
guiRenderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("gui").appendChild(guiRenderer.domElement);

// CSS3D Scene
let css3dContainer = document.getElementById("css3d");
var cssScene = new THREE.Scene();
let cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
css3dContainer.appendChild(cssRenderer.domElement);

// Three.js Scene
const scene = new THREE.Scene();

const game = {
  scene: scene,
  guiScene: guiScene,
  guiCamera: guiCamera,
  cssScene: cssScene,
  world: world
};

// Camera and Player
const player = new Player(game);
player.setPosition(
  Math.round(Math.random() * 20 - 10),
  4,
  Math.round(Math.random() * 20 - 10)
);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById("game").appendChild(renderer.domElement);

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

Lighting.initializeLighting(game);

let isMultiplayer = document.URL.substring(document.URL.indexOf("?") + 1) != 'offline';
if (!isMultiplayer)
  NetworkManager.setOffline();

// DEBUG ASSETS ------------

const cannonDebugger = new CannonDebugger(scene, world, {});

let sun = new Lighting.Light(new THREE.AmbientLight(0xFFFFFF, 0.3));

//let computer = new Computer(game, cssScene);
//computer.setPosition(Math.floor(player.position.x), -0.5, Math.floor(player.position.z - 10));

// -------------------------

document.addEventListener("keydown", function (e) {
  let k = e.key;
  if (k == "Escape") {
    e.preventDefault();
    //console.log("Escape");
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

GUI.loadHand(guiScene, player);

function applySettings() {
  Settings.loadAllSettings();

  player.normalFov = Settings.settings.fov * 1;
  player.sprintFov = player.normalFov * 1 + 6;
  player.zoomFov = player.normalFov * 1 - 50;

  renderer.setPixelRatio(Settings.settings.resolution);
  guiRenderer.setPixelRatio(Settings.settings.resolution);

  player.camera.fov = player.normalFov;
  player.camera.updateProjectionMatrix();
}
window.applySettings = applySettings;
setTimeout(applySettings(), 100);

// Game Loop
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000; // Delta Time
  requestAnimationFrame(animate);

  world.fixedStep(); // Update the physics world
  //cannonDebugger.update(); // Display the physics world

  player.update(dt);

  stats.update(); // FPS Counter

  // Network Updates:
  NetworkManager.requestSimulationUpdate();
  NetworkManager.sendInfoToServer(player);
  let playerCount = Object.keys(NetworkManager.playerList).length + 1;
  document.getElementById("playerCount").innerHTML = `${playerCount} player${(playerCount == 1 ? "" : "s")} connected`;
  document.getElementById("netId").innerHTML = `${player.networkId}`;

  // Update the GUI Lighting space to reflect game lighting space
  Lighting.updateGuiLights(player);

  // Get CPU Updates
  NetworkManager.requestAllCpuUpdates();

  // Renderers
  cssRenderer.render(cssScene, player.camera);
  renderer.render(scene, player.camera);
  guiRenderer.render(guiScene, guiCamera);

  previousTime = currentTime;
}
animate();

// Adjusts cameras when the window is resized
window.addEventListener('resize', () => {
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  guiCamera.aspect = window.innerWidth / window.innerHeight;
  //guiCamera.updateProjectionMatrix();
  guiRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setPixelRatio(Settings.settings.resolution);
guiRenderer.setPixelRatio(Settings.settings.resolution);

NetworkManager.initialize(player);