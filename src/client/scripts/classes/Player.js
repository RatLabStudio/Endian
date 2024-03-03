// Endian Player Class
// Rat Lab Studio 2024

import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { NetworkObject } from './NetworkObject';
import { GameObject } from './GameObject';

import * as CANNON from 'cannon-es';

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

    // Player controls
    controlKeys = {
        forward: 87,  // W
        backward: 83, // S
        left: 65,     // A
        right: 68,    // D
        sprint: 16,   // Shift
    };

    constructor(game) {
        this.game = game;
        this.game.scene.add(this.camera);
        //this.game.scene.add(this.cameraHelper);

        // Network Setup
        this.networkObject = new NetworkObject();
        this.networkObject.infoToSend = {
            networkId: this.networkObject.networkId,
            position: this.camera.position,
            rotation: this.camera.quaternion
        }

        // Physics Object for Collisions
        this.gameObject = new GameObject(
            new THREE.CylinderGeometry(2, 2, 0, 16, 1, false),
            new THREE.MeshBasicMaterial(),
            new CANNON.Body({
                mass: 1000,
                shape: new CANNON.Cylinder(0.45, 0.45, 2.5, 8)
            }),
            this.game
        );
        // Remove the visual object from the local client because you cannot see it
        this.game.scene.remove(this.gameObject.mesh);
        this.gameObject.material.dispose();

        let temp = this;
        document.addEventListener('click', function (e) {
            if (e.target.tagName.toUpperCase() === "CANVAS")
                temp.lockControls();
        });
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        this.camera.rotation.order = "YXZ"; // Changes the way that getting camera rotation works, used for controls
    }

    update(dt) {
        this.physicsUpdate();
        this.applyInputs(dt);
    }

    physicsUpdate() {
        // Sync Camera to Physics Body
        this.position.set(this.gameObject.position.x, this.gameObject.position.y + 1, this.gameObject.position.z);
        // Keep Player Upright
        this.gameObject.body.quaternion.x = 0;
        this.gameObject.body.quaternion.z = 0;
    }

    // Determine which keys are pressed and store the information
    processInput() {
        // Temporary Sprinting
        if (this.keys[this.controlKeys.sprint]) {
            this.maxSpeed = 15;
            this.camera.fov = 76;
            this.camera.updateProjectionMatrix();
        } else {
            this.maxSpeed = 10;
            this.camera.fov = 70;
            this.camera.updateProjectionMatrix();
        }

        // Store Movement Controls
        let zSpeed = 0;
        if (this.keys[this.controlKeys.forward])
            zSpeed += this.maxSpeed;
        if (this.keys[this.controlKeys.backward])
            zSpeed -= this.maxSpeed;
        this.input.z = zSpeed;

        let xSpeed = 0;
        if (this.keys[this.controlKeys.left])
            xSpeed -= this.maxSpeed;
        if (this.keys[this.controlKeys.right])
            xSpeed += this.maxSpeed;
        this.input.x = xSpeed;
    }

    // Take the info stored from processInput() and apply it to the player
    applyInputs(dt) {
        this.processInput();
        if (this.controls.isLocked) {
            // Collect Velocity Vectors
            this.velocity.x = this.input.x;
            this.velocity.z = this.input.z;

            // Move Player
            this.moveRight(this.velocity.x * dt);
            this.moveForward(this.velocity.z * dt);

            // Coordinates Display
            document.getElementById("playerPosition").innerHTML = `
                ${this.position.x.toFixed(1)}, 
                ${this.position.y.toFixed(1)}, 
                ${this.position.z.toFixed(1)}
            `;
        }

        // Update for networking
        this.networkObject.infoToSend = {
            networkId: this.networkObject.networkId,
            position: this.camera.position,
            rotation: this.camera.quaternion
        }
    }

    // Moves the entire player object forward based on where it's camera is facing (negative to go back)
    moveForward(distance) {
        if (distance != 0)
            this.gameObject.body.wakeUp();
        this.gameObject.body.position.x -= Math.sin(this.camera.rotation.y) * distance;
        this.gameObject.body.position.z -= Math.cos(this.camera.rotation.y) * distance;
    }

    // Moves the entire player object to the right based on where it's camera is facing (negative to go left)
    moveRight(distance) {
        if (distance != 0)
            this.gameObject.body.wakeUp();
        this.gameObject.body.position.x += -Math.sin(this.camera.rotation.y - Math.PI / 2) * distance;
        this.gameObject.body.position.z += -Math.cos(this.camera.rotation.y - Math.PI / 2) * distance;
    }

    // Locks the mouse to the screen for gameplay
    lockControls() {
        if (!this.controls.isLocked) {
            this.controls.lock();
        }
    }

    get position() {
        return this.camera.position;
    }

    get rotation() {
        return this.camera.rotation;
    }

    setPosition(x, y, z) {
        this.gameObject.setPosition(x, y, z);
    }

    setRotation(x, y, z) {
        this.gameObject.setRotation(x, y, z);
    }

    onKeyDown(event) {
        this.lockControls();
        this.keys[event.keyCode] = true;
    }

    onKeyUp(event) {
        this.keys[event.keyCode] = false;
    }
}