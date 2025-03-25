// Endian Simulation Viewer - Rat Lab Studio 2024

import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { io } from "socket.io-client";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import * as Resources from "./Resources.js";

var debuggerEnabled = false;

if (!localStorage.getItem("debugMode"))
  localStorage.setItem("debugMode", "false");
else if (localStorage.getItem("debugMode") == "true") {
  debuggerEnabled = true;
  document.getElementById("toggleDebugger").classList.add("enabled");
}

/////////////// IP Management ///////////////

if (!localStorage.getItem("ip") || localStorage.getItem("ip") == "null")
  localStorage.setItem(
    "ip",
    prompt("What Endian Server would you like to view?")
  );

let ip = localStorage.getItem("ip");
//let ip = "192.168.1.254"; // Home PC
//let ip = "192.168.1.163"; // Local Server
//let ip = "65.32.118.97"; // Public Server
let socket = io(`http://${ip}:3000`);
document.getElementById("ip").innerHTML = ip;

/////////////////////////////////////////////

let objs = {};
let players = {};

// FPS Counter Creation
let stats = new Stats();
document.body.append(stats.dom);

/////////////// Scene Setup ///////////////

let scene = new THREE.Scene();

const world = new CANNON.World({
  //gravity: new CANNON.Vec3(0, -50, 0),
});
world.allowSleep = false;

let game = {
  scene: scene,
  world: world,
};

let cannonDebugger = new CannonDebugger(scene, world, {});

let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(-25, 5, -25);
camera.lookAt(new THREE.Vector3(0, 0, 0));
controls.update();

window.addEventListener("resize", function () {
  let width = window.innerWidth;
  let height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

/////////////////////////////////////////////

/////////////// Networking ///////////////

socket.on("connect", () => {
  console.log(`Connected with ID: ${socket.id}`);
  document.getElementById("networkId").innerHTML = socket.id;
});

socket.on("sendSimulationSceneForView", (data) => {
  let objKeys = Object.keys(objs);
  let newObjs = data.objects;
  let newObjKeys = Object.keys(newObjs);

  let playerKeys = Object.keys(players);
  let newPlayers = data.players;
  let newPlayerKeys = Object.keys(newPlayers);

  // Update Objects
  for (let i = 0; i < newObjKeys.length; i++) {
    if (!objs[newObjKeys[i]]) {
      objs[newObjKeys[i]] = Resources.createObject(
        newObjs[newObjKeys[i]].resourceId
      );
      scene.add(objs[newObjKeys[i]].mesh);
      objs[newObjKeys[i]].body.mass = 0;
      world.addBody(objs[newObjKeys[i]].body);
    }

    objs[newObjKeys[i]].mesh.position.copy(newObjs[newObjKeys[i]].position);
    objs[newObjKeys[i]].body.position.copy(newObjs[newObjKeys[i]].position);

    objs[newObjKeys[i]].mesh.quaternion.copy(newObjs[newObjKeys[i]].quaternion);
    objs[newObjKeys[i]].body.quaternion.copy(newObjs[newObjKeys[i]].quaternion);
  }

  // Delete objects that aren't found
  for (let i = 0; i < objKeys.length; i++) {
    if (!newObjs[objKeys[i]]) {
      scene.remove(objs[objKeys[i]].mesh);
      world.removeBody(objs[objKeys[i]].body);
      delete objs[objKeys[i]];
    }
  }

  // Update Players
  for (let i = 0; i < newPlayerKeys.length; i++) {
    if (!players[newPlayerKeys[i]]) {
      players[newPlayerKeys[i]] = Resources.createObject("player");
      scene.add(players[newPlayerKeys[i]].mesh);
      players[newPlayerKeys[i]].body.mass = 0;
      world.addBody(players[newPlayerKeys[i]].body);
    }

    players[newPlayerKeys[i]].mesh.position.copy(
      newPlayers[newPlayerKeys[i]].position
    );
    players[newPlayerKeys[i]].body.position.copy(
      newPlayers[newPlayerKeys[i]].position
    );

    players[newPlayerKeys[i]].mesh.rotation.copy(
      newPlayers[newPlayerKeys[i]].rotation
    );
    players[newPlayerKeys[i]].mesh.rotation.x = 0; // Keep the player upright
    players[newPlayerKeys[i]].body.quaternion.x = 0;
    players[newPlayerKeys[i]].body.quaternion.y = 0;
    players[newPlayerKeys[i]].body.quaternion.z = 0;
  }

  // Delete players that aren't found
  for (let i = 0; i < playerKeys.length; i++) {
    if (!newPlayers[playerKeys[i]]) {
      scene.remove(players[playerKeys[i]].mesh);
      world.removeBody(players[playerKeys[i]].body);
      delete players[playerKeys[i]];
    }
  }
});

/////////////////////////////////////////////

/////////////// Lighting and Ambiance ///////////////

scene.add(new THREE.AmbientLight(0xffffff, 0.1));

let sun = new THREE.DirectionalLight();
sun.intensity = 0.5;
sun.position.set(-10, 50, -10);
sun.castShadow = true;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.camera.top = 50;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 100;
scene.add(sun);

/////////////////////////////////////////////

function toggleDebugger() {
  debuggerEnabled = !debuggerEnabled;
  if (debuggerEnabled) {
    document.getElementById("toggleDebugger").classList.add("enabled");
    localStorage.setItem("debugMode", "true");
  } else {
    document.getElementById("toggleDebugger").classList.remove("enabled");
    localStorage.setItem("debugMode", "false");
    window.location.reload();
  }
}
window.toggleDebugger = toggleDebugger;

function changeServer() {
  localStorage.setItem("ip", null);
  window.location.reload();
}
window.changeServer = changeServer;

function resetSimulation() {
  socket.emit("resetSimulation");
}
window.resetSimulation = resetSimulation;

function resetCamera() {
  controls.object.position.set(-25, 5, -25);
  controls.target.set(0, 0, 0);
}
window.resetCamera = resetCamera;

// Sets the camera to last stored position if there is data for it from today
function setCameraFromMemory() {
  let date = new Date();
  let currentDate = [date.getMonth() + 1, date.getDate(), date.getFullYear()];

  let setDate = "";
  if (localStorage.getItem("cameraSetTime"))
    setDate = localStorage.getItem("cameraSetTime").split("-");
  if (setDate.length > 0) {
    if (
      setDate[2] <= currentDate[2] &&
      setDate[1] <= currentDate[1] &&
      setDate[0] <= currentDate[0]
    ) {
      let pos = localStorage.getItem("cameraPosition").split(",");
      controls.object.position.set(pos[0], pos[1], pos[2]);
      let tar = localStorage.getItem("cameraTarget").split(",");
      controls.target.set(tar[0], tar[1], tar[2]);
    }
  }
}
setCameraFromMemory();

/////////////// Loop ///////////////

setInterval(async function () {
  socket.emit("requestSimulationForView");

  world.fixedStep(); // Update the physics world

  if (debuggerEnabled) cannonDebugger.update();

  // Store Camera Information:
  let cameraPos = controls.object.position;
  localStorage.setItem(
    "cameraPosition",
    `${cameraPos.x},${cameraPos.y},${cameraPos.z}`
  );
  let cameraTar = controls.target;
  localStorage.setItem(
    "cameraTarget",
    `${cameraTar.x},${cameraTar.y},${cameraTar.z}`
  );
  let date = new Date();
  localStorage.setItem(
    "cameraSetTime",
    `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`
  );

  stats.update(); // FPS Counter
  controls.update();
  renderer.render(scene, camera);
}, 0);

/////////////////////////////////////////////
