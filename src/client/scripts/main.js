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

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -10, 0)
});

// Three.js Scene
const scene = new THREE.Scene();

const game = {
  scene: scene,
  world: world
};

// Camera and Player
const player = new Player(game);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
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

function setupLights() {
  const sun = new THREE.DirectionalLight();
  sun.intensity = 0.8;
  sun.position.set(-10, 20, -20);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.0001;
  sun.shadow.mapSize = new THREE.Vector2(1024, 1024)
  scene.add(sun);
  let visualSun = new GameObject(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0xFFFF00 }),
    new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
    }),
    game
  );
  visualSun.setPosition(sun.position.x, sun.position.y, sun.position.z);
  visualSun.mesh.castShadow = false;
  /*const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  scene.add(shadowHelper);*/

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.25;
  scene.add(ambient);
}
setupLights();

let ground = new Voxel({ x: 60, y: 1, z: 60 }, 0, new THREE.MeshLambertMaterial({ color: 0xB6B6B6 }), game);
ground.setPosition(0, -5, 0);

let test = new Voxel({ x: 1, y: 1, z: 1 }, 1, new THREE.MeshLambertMaterial({ color: 0x00FFFF }), game);
test.setPosition(0, 2, -10);
const cannonDebugger = new CannonDebugger(scene, world, {});

// Game Loop
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000; // Delta Time
  requestAnimationFrame(animate);

  world.fixedStep(dt); // Update the physics world
  //cannonDebugger.update(); // Display the physics world

  test.update(); // This will later be done to all objects

  player.applyInputs(dt); // Detect and apply all inputs from the controls
  player.physicsUpdate(); // Update the player in the physics world
  
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
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//renderer.setPixelRatio(1);

NetworkManager.initialize(player);