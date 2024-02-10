import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { GameObject } from './classes/GameObject.js';
import { Player } from './classes/Player.js';

// Three.js Scene
const scene = new THREE.Scene();

// Camera and Player
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
const player = new Player(scene);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// FPS Counter Creation
const stats = new Stats();
document.body.append(stats.dom);

// OrbitCamera Controls
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(5, -5, 5);
controls.update();

// Test Cube
let cube = new GameObject(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial(),
  scene
);
cube.setPosition(0, 0, -10);
let cr = { x: 0, y: 0 };

// Game Loop
function animate() {
  requestAnimationFrame(animate);

  cube.setRotation(cr.x += 0.01, 0, cr.y += 0.01);
  stats.update();

  renderer.render(scene, player.camera);
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