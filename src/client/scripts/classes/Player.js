// Endian Player Class
// Rat Lab Studio 2024

import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class Player {
    maxSpeed = 10;
    input = new THREE.Vector3();
    velocity = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    controls = new PointerLockControls(this.camera, document.body); // Allows you to move the camera
    cameraHelper = new THREE.CameraHelper(this.camera); // Allows you to see where the camera is

    keys = []; // Stores which keys are currently pressed

    // Player controls
    controlKeys = {
        forward: 87,  // W
        backward: 83, // S
        left: 65,     // A
        right: 68     // D
    };

    constructor(scene) {
        scene.add(this.camera);
        //scene.add(this.cameraHelper);

        document.addEventListener('click', this.lockControls.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    processInput() {
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

    applyInputs(dt) {
        this.processInput();
        if (this.controls.isLocked) {
            this.velocity.x = this.input.x;
            this.velocity.z = this.input.z;
            this.controls.moveRight(this.velocity.x * dt);
            this.controls.moveForward(this.velocity.z * dt);

            document.getElementById("playerPosition").innerHTML = `${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)}`;
        }
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

    onKeyDown(event) {
        this.lockControls();
        this.keys[event.keyCode] = true;
    }

    onKeyUp(event) {
        this.keys[event.keyCode] = false;
    }
}