// Endian Alpha v5
// Copyright Rat Lab Studio 2024

// Version Information
import { info } from './versionInfo.js';
document.getElementById("versionInfo").innerHTML = `${info.name} ${info.version}`;

// Importing Engine Classes
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// Importing Supporting Game Classes
import { GameObject } from './classes/GameObject.js';
import { Player } from './classes/Player.js';
import * as NetworkManager from './NetworkManager.js';

// Three.js Scene
const scene = new THREE.Scene();

// Camera and Player
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
const player = new Player(scene);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

// FPS Counter Creation
const stats = new Stats();
document.body.append(stats.dom);

// OrbitCamera Controls
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(5, -5, 5);
controls.update();

// Setting up the sky:
const loader = new THREE.CubeTextureLoader();
loader.setPath( 'assets/textures/sky/' );
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
    scene
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

// Test Cube
let cube = new GameObject(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial(),
  scene
);
cube.setPosition(0, 0, -10);
let cr = { x: 0, y: 0 };

let cL = new GameObject(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0x0099FF }),
  scene
);
cL.setPosition(-2 * 1, -2, -10 * 1);

let cR = new GameObject(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0x00FF99 }),
  scene
);
cR.setPosition(2 * 1, -2, -10 * 1);

// Create test voxels
for (let i = -20; i < 20; i++) {
  for (let j = -20; j < 20; j++) {
    let c = new GameObject(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0xB6B6B6 }),
      scene
    );
    c.setPosition(i * -1, -3, j * -1);
    c.mesh.castShadow = false;
  }
}

// Game Loop
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000; // Delta Time
  requestAnimationFrame(animate);

  player.applyInputs(dt);
  cube.setRotation(cr.x += 0.01, 0, cr.y += 0.01);
  stats.update();

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

renderer.setPixelRatio(0.4);

NetworkManager.initialize(player);