// Endian Player Class
// Rat Lab Studio 2024

import * as THREE from "three";
import * as CANNON from "cannon-es";

import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import * as Settings from "../settings.js";
import * as Resources from "../Resources.js";
import * as NetworkManager from "../NetworkManager.js";
import * as UI from "../ui.js";
import * as Hand from "../hand.js";
import * as State from "../state.js";

export class Player {
  maxSpeed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();

  pos = { x: 0, y: 0, z: 0 };
  rot = { x: 0, y: 0, z: 0 };

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
  controls = new PointerLockControls(this.camera, document.body); // Allows you to move the camera
  cameraHelper = new THREE.CameraHelper(this.camera); // Allows you to see where the camera is

  keys = []; // Stores which keys are currently pressed
  mouseButtons = [];

  // Player controls
  controlKeys = {
    forward: 87, // W
    backward: 83, // S
    left: 65, // A
    right: 68, // D
    sprint: 16, // Shift
    crouch: 17, // Control
    jump: 32, // Space
    zoom: 67, // C
    type: 13, // Enter
    fullscreen: 122, // F11
    resetSim: 46, // Delete
    radar: 81, // Q
    playerList: 90, // Z
  };

  // Player Mouse Controls
  controlMouseButtons = {
    shoot: 0,
    hold: 2,
  };

  constructor(game) {
    this.game = game;
    this.game.scene.add(this.camera);
    this.networkId = 0;
    //this.game.scene.add(this.cameraHelper);

    this.light = new THREE.PointLight(0xffff99, 0.5);
    this.game.scene.add(this.light);

    // Network Setup
    this.infoToSend = {
      username: Settings.settings.username,
      networkId: this.networkId,
      position: this.camera.position,
      rotation: this.camera.rotation,
    };

    // Physics Object for Collisions
    this.gameObject = Resources.createObject("player");
    this.game.world.addBody(this.gameObject.body);

    this.gameObject.body.allowSleep = true;
    //this.gameObject.body.sleepSpeedLimit = 5.0;
    this.gameObject.body.sleepTimeLimit = 0.25;

    // Event Listeners:
    let temp = this;
    document.addEventListener("click", function (e) {
      if (e.target.tagName.toUpperCase() === "CANVAS") temp.lockControls();
    });
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
    document.addEventListener("mousedown", this.onMouseDown.bind(this));
    document.addEventListener("mouseup", this.onMouseUp.bind(this));
    document.addEventListener("wheel", this.onScroll.bind(this));

    this.camera.rotation.order = "YXZ"; // Changes the way that getting camera rotation works, used for controls

    this.gravityGenerator = true;

    // Jumping
    this.grounded = false;
    this.gameObject.body.addEventListener(
      "collide",
      function (e) {
        let contactNormal = new CANNON.Vec3();
        let upAxis = new CANNON.Vec3(0, 1, 0);
        let contact = e.contact;
        if (contact.bi.id == this.gameObject.body.id) contact.ni.negate(contactNormal);
        else contactNormal.copy(contact.ni);
        if (contactNormal.dot(upAxis) > 0.5) {
          //Threshhold between 0-1
          this.grounded = true;
          this.gameObject.body.velocity.y = 0;
        }
      }.bind(this)
    );

    this.normalFov = Settings.settings.fov; // FOV of the camera
    this.sprintFov = this.normalFov.valueOf() + 7; // FOV to use while sprinting
    this.zoomFov = this.normalFov - 50;
    this.currentFov = this.normalFov.valueOf();
    this.fovRate = 0.1;

    this.currentCameraRotation = 0;

    this.typing = false; // Whether the player is typing into the CPU

    this.raycaster = new THREE.Raycaster();
    this.heldItem = null; // The object you are currently holding
    this.holdDistance = 5; // Stores how far away your currently held object is

    this.lastShot = performance.now(); // Last time the blaster was fired
    this.toolPower = 100; // Ammunition

    this.paused = false; // Reflects whether the game is paused

    this.sun = new THREE.DirectionalLight();
    this.sun.intensity = 0; //.1;
    this.sun.position.set(-10, 50, -10);
    this.sun.castShadow = true;
    this.sun.shadow.camera.left = -50;
    this.sun.shadow.camera.right = 50;
    this.sun.shadow.camera.bottom = -50;
    this.sun.shadow.camera.top = 50;
    this.sun.shadow.camera.near = 0.1;
    this.sun.shadow.camera.far = 100;
    this.game.scene.add(this.sun);

    // Particles
    this.particlesGeometry = new THREE.BufferGeometry();

    this.maxParticles = 100000; // Max number of particles that can be displayed at a time
    this.currentParticle = 0;
    this.particalPositions = new Float32Array(this.maxParticles * 3);

    this.particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(this.particlesGeometry, this.particlesMaterial);
    this.particles.frustumCulled = false;

    this.game.scene.add(this.particles);
  }

  update(dt) {
    this.handleJumping();
    this.physicsUpdate();
    this.cameraUpdate();

    if (!this.paused) {
      this.applyInputs(dt);
      this.updateHeldObject();
      this.updateShooting();
      this.updateRadar();
    }

    this.camera.rotation.z += 0 - this.camera.rotation.z * 0.4;

    if (this.gravityGenerator && !this.grounded && this.gameObject.body.velocity.y > -50) {
      this.gameObject.body.velocity.y -= 0.25;
    }
  }

  handleJumping() {
    // Find objects beneath player
    let rc = new THREE.Raycaster();
    rc.set(
      new THREE.Vector3(
        this.gameObject.body.position.x,
        this.gameObject.body.position.y - this.gameObject.body.shapes[0].height / 2,
        this.gameObject.body.position.z
      ),
      new THREE.Vector3(0, -1, 0)
    );
    let hits = rc.intersectObjects(this.game.scene.children);

    // Check if the player is grounded (making them able to jump)
    if (hits.length > 0) {
      UI.setElement("groundDistance", hits[0].distance.toFixed(3));
      if (hits[0].distance <= 0.5) {
        this.grounded = true;
        this.gameObject.body.velocity.y = 0;
      } else this.grounded = false;
    } else this.grounded = false;
  }

  physicsUpdate() {
    // Update Rotation and Keep Player Upright
    this.gameObject.body.quaternion.setFromEuler(0, this.rotation.y, 0);
  }

  // Determine which keys are pressed and store the information
  processInput() {
    // Store Movement Controls
    let zSpeed = 0;
    if (this.keys[this.controlKeys.forward]) zSpeed += this.maxSpeed;
    if (this.keys[this.controlKeys.backward]) zSpeed -= this.maxSpeed;
    this.input.z = zSpeed;

    let xSpeed = 0;
    if (this.keys[this.controlKeys.left]) xSpeed -= this.maxSpeed;
    if (this.keys[this.controlKeys.right]) xSpeed += this.maxSpeed;
    this.input.x = xSpeed;

    this.currentCameraRotation = xSpeed * -0.01;
    this.camera.rotation.z += (this.currentCameraRotation - this.camera.rotation.z) * 0.05;

    // Temporary Sprinting
    if (this.keys[this.controlKeys.sprint] && (Math.abs(xSpeed) > 0 || Math.abs(zSpeed) > 0)) {
      this.currentFov = this.sprintFov.valueOf();
      this.maxSpeed = 12;
    } else {
      this.currentFov = this.normalFov.valueOf();
      this.maxSpeed = 8;
    }

    if (this.keys[this.controlKeys.zoom]) {
      this.currentFov = this.zoomFov.valueOf();
      this.controls.pointerSpeed = 0.25;
    } else if (!this.keys[this.controlKeys.sprint]) {
      this.currentFov = this.normalFov.valueOf();
      this.controls.pointerSpeed = 0.75;
    }

    if (this.keys[this.controlKeys.playerList]) document.getElementById("playerListPanel").style.visibility = "unset";
    else document.getElementById("playerListPanel").style.visibility = "hidden";

    this.camera.fov += (this.currentFov - this.camera.fov) * this.fovRate;
    this.camera.updateProjectionMatrix();

    // Jumping / Upward Thrust
    if (this.keys[this.controlKeys.jump]) {
      if (this.gravityGenerator && this.grounded) {
        this.gameObject.body.position.y += 0.1; // Move player slightly above the ground to fix grounding issues
        this.gameObject.body.applyImpulse(new CANNON.Vec3(0, 2500, 0));
      }
      this.grounded = false;
    }

    if (this.keys[this.controlKeys.resetSim]) {
      // Makes sure you can only reset every 10 seconds
      if (!this.lastReset || this.lastReset < new Date().getTime() - 10000) {
        // Reset Simulation
        NetworkManager.sendResetRequest();
        this.lastReset = new Date().getTime();
      }
    }
  }

  // Take the info stored from processInput() and apply it to the player
  applyInputs(dt) {
    this.processInput();
    if (this.controls.isLocked) {
      // Collect Velocity Vectors
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;

      // Move Player
      this.move(this.velocity.z, this.velocity.x);

      // Coordinates Display
      document.getElementById("playerPosition").innerHTML = `
                ${this.position.x.toFixed(2)}, 
                ${this.position.y.toFixed(2)}, 
                ${this.position.z.toFixed(2)}
            `;
    }

    this.light.position.copy(this.position);

    // Update for networking
    this.infoToSend = {
      username: Settings.settings.username,
      networkId: this.networkId,
      position: this.position,
      rotation: this.camera.rotation,
    };
  }

  // Moves the player forward and to the right relative to the camera
  move(distanceForward, distanceRight) {
    if (distanceForward != 0 || distanceRight != 0) this.gameObject.body.wakeUp();

    let moveVector = new CANNON.Vec3(); // Store movement

    // Forward Movement
    let multiplier = 1;
    moveVector.x += -Math.sin(this.camera.rotation.y) * distanceForward * multiplier;
    moveVector.z += -Math.cos(this.camera.rotation.y) * distanceForward * multiplier;

    // Right Movement
    moveVector.x += -Math.sin(this.camera.rotation.y - Math.PI / 2) * distanceRight * (multiplier * 0.75);
    moveVector.z += -Math.cos(this.camera.rotation.y - Math.PI / 2) * distanceRight * (multiplier * 0.75);

    // Apply Movements
    if (this.gravityGenerator) {
      this.gameObject.body.velocity.x = moveVector.x;
      this.gameObject.body.velocity.z = moveVector.z;
    }
  }

  // Moves the camera towards the physics body smoothly
  cameraUpdate() {
    // Distance between camera and body
    let difference = {
      x: this.camera.position.x - this.gameObject.body.position.x,
      y: this.camera.position.y - this.gameObject.body.position.y - 1,
      z: this.camera.position.z - this.gameObject.body.position.z,
    };

    // Snaps camera to body if it gets too far away
    if (Math.abs(difference.x) > 3 || Math.abs(difference.y) > 3 || Math.abs(difference.z) > 3) this.camera.position.copy(this.gameObject.body.position);

    let acc = 0.4; // How fast the camera moves toward to body
    // Move the camera towards the body:
    this.camera.position.x -= difference.x * acc;
    this.camera.position.y -= difference.y * acc;
    this.camera.position.z -= difference.z * acc;

    // Move the sun with the player to simulate it being further away
    this.sun.position.set(this.camera.position.x - 10, this.camera.position.y + 50, this.camera.position.z - 10);
  }

  updateShooting() {
    let currentTime = performance.now();
    let timeSinceLastShot = currentTime - this.lastShot;

    if (this.toolPower < 100 && timeSinceLastShot > 1000) this.toolPower += 1;

    if (this.mouseButtons[this.controlMouseButtons.shoot]) {
      if (timeSinceLastShot > 200 && this.toolPower >= 5) {
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        NetworkManager.shootProjectile(raycaster.ray);
        this.lastShot = currentTime; // Store last shot time
        this.toolPower -= 5; // Remove ammunition
        Hand.shootingAnimation();
      }
    }

    UI.setElement("toolPower", this.toolPower);
  }

  updateHeldObject() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    if (State.currentState != State.states.ready) return;
    const intersects = this.raycaster.intersectObjects(this.game.scene.children);

    if (intersects.length > 0 && this.mouseButtons[this.controlMouseButtons.hold] && !this.heldItem) {
      this.heldItem = intersects[0].object;
      // Find the most general form of the object that isn't the scene
      while (!this.heldItem.parent.isScene) this.heldItem = this.heldItem.parent;

      this.holdDistance = intersects[0].distance + 0.5;
    } else if (!this.mouseButtons[this.controlMouseButtons.hold]) {
      this.heldItem = null;
    }

    if (this.heldItem) {
      let newPos = new THREE.Vector3();
      this.raycaster.ray.at(this.holdDistance, newPos);
      NetworkManager.moveNetworkObject(this.heldItem.name, newPos);
    }
  }

  updateRadar() {
    if (this.keys[this.controlKeys.radar]) {
      // Active Scanning
      for (let c = 0; c < 10; c++) {
        // For loop is to increase the rate
        this.raycaster.setFromCamera(new THREE.Vector2(Math.random() * 1 - 0.5, Math.random() * 1 - 0.5), this.camera);
        let intersects = this.raycaster.intersectObjects(this.game.scene.children);

        for (let i = 0; i < intersects.length; i++) {
          if (intersects[i].object.material == this.particlesMaterial) continue; // Ignore other particles

          if (intersects[i].distance > 25) break;

          let point = intersects[i].point;

          this.particalPositions[this.currentParticle * 3] = point.x;
          this.particalPositions[this.currentParticle * 3 + 1] = point.y;
          this.particalPositions[this.currentParticle * 3 + 2] = point.z;

          this.particlesGeometry.setAttribute("position", new THREE.BufferAttribute(this.particalPositions, 3));

          this.currentParticle++;
          if (this.currentParticle > this.maxParticles - 1) this.currentParticle = 0;

          break;
        }
      }

      // Passive Scanning
      for (let c = 0; c < 2; c++) {
        this.raycaster.set(this.camera.position, new THREE.Vector3().randomDirection());
        let intersects = this.raycaster.intersectObjects(this.game.scene.children);

        for (let i = 0; i < intersects.length; i++) {
          if (intersects[i].object.material == this.particlesMaterial) continue;

          if (intersects[i].distance > 15) break;

          let point = intersects[i].point;

          this.particalPositions[this.currentParticle * 3] = point.x;
          this.particalPositions[this.currentParticle * 3 + 1] = point.y;
          this.particalPositions[this.currentParticle * 3 + 2] = point.z;

          this.particlesGeometry.setAttribute("position", new THREE.BufferAttribute(this.particalPositions, 3));

          this.currentParticle++;
          if (this.currentParticle > this.maxParticles - 1) this.currentParticle = 0;

          break;
        }
      }
    }
  }

  // Locks the mouse to the screen for gameplay
  lockControls() {
    if (!this.controls.isLocked) {
      this.controls.lock();
    }
    //document.documentElement.requestFullscreen();
  }

  get position() {
    return this.gameObject.body.position;
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.gameObject.setPosition(x, y, z);
  }

  get rotation() {
    return this.camera.rotation;
  }

  setRotation(x, y, z) {
    this.gameObject.setRotation(x, y, z);
  }

  onKeyDown(event) {
    this.lockControls();

    if (event.keyCode == this.controlKeys.type) this.typing = !this.typing;

    if (!this.typing) this.keys[event.keyCode] = true;
  }

  onKeyUp(event) {
    this.keys[event.keyCode] = false;
  }

  onMouseDown(event) {
    this.mouseButtons[event.button] = true;
  }

  onMouseUp(event) {
    this.mouseButtons[event.button] = false;
  }

  onScroll(event) {
    // Changes the distance of the object you are holding
    this.holdDistance += event.deltaY * -0.005;
    if (this.holdDistance < 2) this.holdDistance = 2;
    else if (this.holdDistance > 20) this.holdDistance = 20;
  }
}
