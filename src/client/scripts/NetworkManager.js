import { io } from "socket.io-client";
import * as CANNON from "cannon-es";
import * as THREE from "three";

import { NetworkObject } from "./classes/NetworkObject.js";
import { ComputerDisplay } from "./classes/ComputerDisplay.js";
import * as Chat from "./chat.js";
import { ModelObject } from "./classes/ModelObject.js";
import * as State from "./state.js";
import * as UI from "./ui.js";

let ip = "localhost";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let newIp = urlParams.get("ip");

if (newIp) ip = newIp; // Public Server
let socket = io(`http://${ip}:3000`);

// Make sure the client waits for player initialization to connect
State.setState("connecting_to_server");
socket.disconnect();
setTimeout(() => {
  socket.connect();
}, 5000);
let connected = false;

let localPlayer = null; // The player on the local computer
export let playerList = {}; // List of players shared from the server
let playerObjs = {}; // List of physical player objects

export let objs = [];

export let cpuDisplays = {};

let justJoined = true;
setTimeout(function () {
  justJoined = false;
}, 2000);

// Set the local player
export function initialize(playerObj) {
  localPlayer = playerObj;
}

socket.on("connect", () => {
  console.log(`Connected with ID: ${socket.id}`);
  localPlayer.networkId = socket.id;
  connected = true;
});

export function setOffline() {
  socket = io("http://localhost:3000");
}

export function leaveGame() {
  window.open(`index.html`, "_self");
}
socket.on("disconnectRequest", () => {
  leaveGame();
});

// Sends only current player's info to the server
export function sendInfoToServer(player) {
  if (!connected) return;
  socket.emit("playerUpdate", player.infoToSend);
}

// Spawns new player object for a new payer
function createPlayerObj(newPlayer) {
  playerObjs[newPlayer.networkId] = new ModelObject(
    "assets/model/player.gltf",
    1,
    new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(0.6, 0.6, 1.5, 8),
    }),
    localPlayer.game
  );
  playerObjs[newPlayer.networkId].bodyOffset.y = -0.25;
}

// Removes a player entirely from the game
function removePlayerObj(playerNetId) {
  let player = playerObjs[playerNetId]; // Player to be removed
  console.log(player);
  localPlayer.game.scene.remove(player.mesh); // Remove player model
  //player.material.dispose(); // Dispose of model texture
  localPlayer.game.world.removeBody(player.body); // Remove physics body
  delete playerObjs[playerNetId]; // Delete JS object
}

// Updates all player objects and creates new ones if necessary
function updatePlayerObjs() {
  let playersArr = Object.keys(playerList);
  let playerObjsArr = Object.keys(playerObjs);
  let updated = {};
  for (let i = 0; i < playersArr.length; i++) {
    let p = playerList[playersArr[i]];
    let obj = playerObjs[playerObjsArr[i]];
    // If no player object exists:
    if (obj == undefined) {
      createPlayerObj(p);
      continue;
    }
    // Update Position
    obj.setPosition(p.position.x, p.position.y + 0.5, p.position.z);

    if (p.rotation) {
      obj.setRotation(0, p.rotation._y - Math.PI / 2, 0);
    }

    updated[playersArr[i]] = true;
  }
  for (let i = 0; i < playerObjsArr.length; i++) {
    if (!updated[playerObjsArr[i]]) removePlayerObj(playerObjsArr[i]);
  }
}

// Receive information from the server about players
socket.on("playerClientUpdate", (players) => {
  playerList = {}; // Reset player list to delete old players
  let playersArr = Object.keys(players);

  let playerListContainer = document.getElementById("playerListContainer");
  playerListContainer.innerHTML = "";

  for (let i = 0; i < playersArr.length; i++) {
    let p = players[playersArr[i]];

    playerListContainer.innerHTML += `<div class="playerListElement" id="playerList-${p.networkId}">${p.username}</div>`;

    if (p.networkId == socket.id)
      // Skip local player
      continue; // NOTE: Local Player is NOT stored in the player list
    playerList[playersArr[i]] = p; // Update player with new info from server
  }

  document.getElementById(`playerList-${socket.id}`).style.color = "lime";

  updatePlayerObjs(); // Update the physical objects to reflect info
});

socket.on("removePlayer", (playerNetId) => {
  let playerToRemove = playerList[playerNetId];
  removePlayerObj(playerToRemove);
});

let tps = 0;
let lastObjectUpdate = performance.now();
// When the server sends NetworkObject updates
socket.on("objectUpdates", (updatedObjs) => {
  let updatedObjKeys = Object.keys(updatedObjs);
  for (let i = 0; i < updatedObjKeys.length; i++) {
    let obj = objs[updatedObjKeys[i]];
    if (!obj) {
      // Create New Object
      objs[updatedObjKeys[i]] = new NetworkObject(updatedObjs[updatedObjKeys[i]].id, updatedObjs[updatedObjKeys[i]].resourceId);
      // Add object body to client game, mesh is added later to account for loading times
      localPlayer.game.world.addBody(objs[updatedObjKeys[i]].object.body);
    } else {
      // Add object mesh to client game
      if (objs[updatedObjKeys[i]].waitingToBeAddedToGame) localPlayer.game.scene.add(objs[updatedObjKeys[i]].object.mesh);

      // Update Existing Object
      objs[updatedObjKeys[i]].updateFromServer(updatedObjs[updatedObjKeys[i]]);
    }
  }

  // Check for objects that no longer exist
  let objKeys = Object.keys(objs);
  for (let i = 0; i < objKeys.length; i++) {
    if (!updatedObjs[objKeys[i]]) {
      localPlayer.game.scene.remove(objs[objKeys[i]].object.mesh);
      localPlayer.game.world.removeBody(objs[objKeys[i]].object.body);
      delete objs[objKeys[i]];
    }
  }

  if (State.currentState <= State.getStateId("loading_simulation"))
    setTimeout(function () {
      State.setState("ready");
    }, 1500);

  let currentTime = performance.now();
  tps = Math.round(1000 / (currentTime - lastObjectUpdate));
  lastObjectUpdate = currentTime;
  //console.log(tps);
});

export function moveNetworkObject(id, position) {
  socket.emit("moveNetworkObject", { id, position });
}

// Request updates from the simulation

export function requestSimulationUpdate() {
  socket.emit("requestSimulationUpdate"); // Updates networked objects
  socket.emit("requestRayDisplayInfo"); // Updates blaster rays
  socket.emit("requestPlayerInfo", socket.id); // Gets info for the current player
  socket.emit("requestNewChatMessages"); // Gets all new chat messages
  socket.emit("requestAllCpuLocations");
}

/////////////// CPU Functions ///////////////

let cpus = {}; // List of all CPUs

// Determine what CPU screens are nearby for rendering
let nearbyCpus = {};
socket.on("receiveAllCpuLocations", (data) => {
  let dataKeys = Object.keys(data);
  for (let i = 0; i < dataKeys.length; i++) {
    // Determine how far away the monitor is
    let distance = Math.floor(
      Math.abs(data[dataKeys[i]].x - localPlayer.position.x + data[dataKeys[i]].y - localPlayer.position.y + data[dataKeys[i]].z - localPlayer.position.z)
    );
    // Only nearby monitors are rendered
    if (distance < 100) nearbyCpus[dataKeys[i]] = true;
    else if (nearbyCpus[dataKeys[i]]) delete nearbyCpus[dataKeys[i]];
  }
  // TODO: CHECK FOR CPUS THAT NO LONGER EXIST

  if (Object.keys(nearbyCpus).length > 0) socket.emit("requestCpuData", nearbyCpus); // Request the data for all nearby CPUs
});

socket.on("receiveCpuData", (data) => {
  let dataKeys = Object.keys(data);
  for (let i = 0; i < dataKeys.length; i++) {
    let newCpuData = data[dataKeys[i]];
    // Create Computer Display
    if (!cpus[dataKeys[i]]) {
      cpus[dataKeys[i]] = new ComputerDisplay(
        dataKeys[i], // ID
        localPlayer.game, // Game to place the monitor in
        localPlayer.game.cssScene, // CSS scene to display the screen content
        data[dataKeys[i]].resolution.x, // Resolution of the screen
        data[dataKeys[i]].resolution.y
      );
    }

    cpus[dataKeys[i]].setPosition(newCpuData.position.x, newCpuData.position.y, newCpuData.position.z);
    cpus[dataKeys[i]].setRotation(newCpuData.rotation._x, newCpuData.rotation._y, newCpuData.rotation._z);
    if (newCpuData.rowToUpdate >= 0) {
      cpus[dataKeys[i]].newPixels[newCpuData.rowToUpdate] = newCpuData.pixels;
      cpus[dataKeys[i]].updateRow(newCpuData.rowToUpdate);
      cpus[dataKeys[i]].updateLight();
    }
  }
});

// Sends CPU input to the server for processing
export function sendInputToCpu(cpuId, inputChar) {
  socket.emit("cpuInput", cpuId, inputChar);
}

document.addEventListener("keydown", function (e) {
  if (!localPlayer.typing) return;

  let k = e.key;

  let cpuKeys = Object.keys(cpus); // Get list of CPUs

  let closestCpu = null;
  for (let i = 0; i < cpuKeys.length; i++) {
    let currentCpu = cpus[cpuKeys[i]]; // CPU to compare

    // First CPU checked it set as closest by default
    if (!closestCpu) {
      closestCpu = currentCpu;
      continue;
    }

    // Store distances of each CPU from player
    let closestCpuDistance = localPlayer.position.distanceTo(closestCpu.position);
    let comparingCpuDistance = localPlayer.position.distanceTo(currentCpu.position);

    // Compare the distances
    if (comparingCpuDistance < closestCpuDistance) closestCpu = currentCpu;
  }

  // Send characters to closest CPU
  sendInputToCpu(closestCpu.id, k.toLowerCase());
});

/////////////////////////////////////////////

export function shootProjectile(ray) {
  let rayToSend = {
    id: socket.id + "time" + performance.now().toFixed(3).replace(".", ""),
    sender: socket.id,
    ray: {
      origin: ray.origin,
      direction: ray.direction,
    },
  };
  socket.emit("shootProjectile", rayToSend);
}

socket.on("playerInfoUpdate", (playerInfo) => {
  UI.setElement("health", playerInfo.health);
  if (playerInfo.health <= 0) {
    window.location.reload();
  }
});

socket.on("sendNewChatMessages", (messages) => {
  for (let i = 0; i < messages.length; i++) Chat.log(messages[i].message, messages[i].color);
});

export function sendResetRequest() {
  socket.emit("resetSimulation");
}
