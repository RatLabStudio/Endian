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
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';

// Post-Processing
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';

// Importing Supporting Game Classes
import { Player } from './classes/Player.js';
import * as NetworkManager from './NetworkManager.js';
import * as Settings from './settings.js';
import * as Lighting from './classes/Lighting.js';
import * as State from './state.js';
import * as GUI from './hand.js';
import * as Physics from './physics.js';
import { GameObject } from './classes/GameObject.js';
import * as UI from './ui.js';

State.setState("loading");

Settings.loadAllSettings();

/////////////// Engine Setup ///////////////

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -50, 0)
});
world.allowSleep = true;
Physics.initialize(world);

// GUI Scene
const guiScene = new THREE.Scene();
const guiCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
const guiRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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

const cannonDebugger = new CannonDebugger(scene, world, {});

// Camera and Player
const player = new Player(game);
NetworkManager.initialize(player);

let renderer;
if (Settings.settings.usewebgpu == 0) {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  UI.setElement("renderer", "WebGL");
}
else {
  renderer = new WebGPURenderer({ alpha: true, antialias: true });
  UI.setElement("renderer", "WebGPU");
}
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("game").appendChild(renderer.domElement);


////////// Post-Processing //////////

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, player.camera);
composer.addPass(renderPass);

const guiComposer = new EffectComposer(guiRenderer);
const guiRenderPass = new RenderPass(guiScene, guiCamera);
guiComposer.addPass(guiRenderPass);

if (Settings.settings['postprocessing'] > 0) {
  const unrealBloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.2, 0.1);
  composer.addPass(unrealBloomPass);
  guiComposer.addPass(unrealBloomPass);

  const pixelatedPass = new RenderPixelatedPass(window.innerWidth / 768, scene, player.camera);
  composer.addPass(pixelatedPass);
  guiComposer.addPass(new RenderPixelatedPass(window.innerWidth / 768, guiScene, guiCamera));

  const filmPass = new FilmPass(window.innerWidth / 3000, false);
  composer.addPass(filmPass);
  guiComposer.addPass(filmPass);

  const bloomPass = new BloomPass(1, 5, 0.5);
  composer.addPass(bloomPass);
  guiComposer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);
  guiComposer.addPass(outputPass);
}

////////////////////////////////////////////////////////////


// FPS Counter Creation
const stats = new Stats();
//document.body.append(stats.dom);

// Setting up the sky:
const loader = new THREE.CubeTextureLoader();
loader.setPath('assets/textures/sky/');
const textureCube = loader.load([
  'sky.jpg', 'sky.jpg',
  'sky.jpg', 'sky.jpg',
  'sky.jpg', 'sky.jpg'
]);
scene.background = textureCube;


/////////////// Settings and GUI ///////////////

let isMultiplayer = document.URL.substring(document.URL.indexOf("?") + 1) != 'offline';
if (!isMultiplayer)
  NetworkManager.setOffline();

// Detect when the user leaves pointerLock
document.addEventListener("pointerlockchange", function (e) {
  if (!player.controls.isLocked)
    setPause(true);
});

// Displays pause menu and handles pointerlock
function setPause(state) {
  if (state) {
    player.paused = true;
    document.getElementById("pauseMenu").style.visibility = "unset";
  } else {
    player.paused = false;
    player.lockControls();
    document.getElementById("pauseMenu").style.visibility = "hidden";
  }
}
window.setPause = setPause;

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
applySettings();

////////////////////////////////////////////////////////////


/////////////// Game Loop ///////////////

State.setState("loading_simulation");
let fps = 0;
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  fps = Math.round((1000 / (currentTime - previousTime)));
  let dt = (currentTime - previousTime) / 1000; // Delta Time
  requestAnimationFrame(animate);

  if (State.currentState >= State.getStateId("ready"))
    world.fixedStep(); // Update the physics world
  cannonDebugger.update(); // Display the physics world

  player.update(dt);

  stats.update(); // FPS Counter

  // Network Updates:
  NetworkManager.requestSimulationUpdate();
  NetworkManager.sendInfoToServer(player);
  let playerCount = Object.keys(NetworkManager.playerList).length + 1;
  UI.setElement("playerCount", playerCount);
  UI.setElement("netId", player.networkId);

  // Update the GUI Lighting space to reflect game lighting space
  Lighting.updateGuiLights(player);

  // Renderers
  //if (State.currentState >= State.getStateId("ready")) {
    if (Settings.settings.usewebgpu == 1)
      renderer.renderAsync(scene, player.camera);
    else
      composer.render();
    cssRenderer.render(cssScene, player.camera);
  //}
  //guiRenderer.render(guiScene, guiCamera);
  guiComposer.render();

  previousTime = currentTime;
}
animate();

////////////////////////////////////////////////////////////


// Update the framerate
setInterval(function () { UI.setElement('fps', fps); }, 2000);

////////////////////////////////////////////////////////////


/////////////// Cameras and Renderer Updating ///////////////

// Adjusts cameras when the window is resized
window.addEventListener('resize', () => {
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();

  guiCamera.aspect = window.innerWidth / window.innerHeight;
  guiCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  guiRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setPixelRatio(Settings.settings.resolution);
guiRenderer.setPixelRatio(Settings.settings.resolution);

window.addEventListener('click', function () {
  player.gameObject.body.wakeUp();
});

////////////////////////////////////////////////////////////


/////////////// Start of Program ///////////////

let ambient = new Lighting.Light(new THREE.AmbientLight(0xFFFFFF, 0.1));
guiScene.add(new THREE.AmbientLight(0xFFFFFF, 0.5)); // The hand should alway be a little brighter than the scene

GUI.loadHand(guiScene, player);
Lighting.initializeLighting(game);

// Place the player in a random position
player.setPosition(Math.round(Math.random() * 20 - 10), 4, Math.round(Math.random() * 20 - 10));

////////////////////////////////////////////////////////////