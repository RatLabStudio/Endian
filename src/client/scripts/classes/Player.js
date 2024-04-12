// Endian Player Class
// Rat Lab Studio 2024

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as Settings from '../settings.js';
import * as Resources from '../Resources.js';
import * as NetworkManager from '../NetworkManager.js';
import * as UI from '../ui.js';
import * as Hand from '../hand.js';

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
        forward: 87,  // W
        backward: 83, // S
        left: 65,     // A
        right: 68,    // D
        sprint: 16,   // Shift
        jump: 32,     // Space
        zoom: 67,     // C
        type: 13,     // Enter
    };

    // Player Mouse Controls
    controlMouseButtons = {
        shoot: 0,
        hold: 2
    };

    constructor(game) {
        this.game = game;
        this.game.scene.add(this.camera);
        this.networkId = 0;
        //this.game.scene.add(this.cameraHelper);

        this.light = new THREE.PointLight(0xFFFF99, 0.5);
        this.game.scene.add(this.light);

        // Network Setup
        this.infoToSend = {
            username: Settings.settings.username,
            networkId: this.networkId,
            position: this.camera.position,
            rotation: this.camera.rotation
        };

        // Physics Object for Collisions
        this.gameObject = Resources.createObject('player');
        this.game.world.addBody(this.gameObject.body);

        this.gameObject.body.allowSleep = true;
        this.gameObject.body.sleepSpeedLimit = 5.0;
        this.gameObject.body.sleepTimeLimit = 0.25;

        // Event Listeners:
        let temp = this;
        document.addEventListener('click', function (e) {
            if (e.target.tagName.toUpperCase() === "CANVAS")
                temp.lockControls();
        });
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('wheel', this.onScroll.bind(this));

        this.camera.rotation.order = "YXZ"; // Changes the way that getting camera rotation works, used for controls

        // Jumping
        this.canJump = false;
        this.gameObject.body.addEventListener("collide", function (e) {
            let contactNormal = new CANNON.Vec3();
            let upAxis = new CANNON.Vec3(0, 1, 0);
            let contact = e.contact;
            if (contact.bi.id == this.gameObject.body.id)
                contact.ni.negate(contactNormal);
            else
                contactNormal.copy(contact.ni);
            if (contactNormal.dot(upAxis) > 0.5) { //Threshhold between 0-1
                this.canJump = true;
                this.gameObject.body.velocity.y = 0;
            }
        }.bind(this));

        this.normalFov = Settings.settings.fov; // FOV of the camera
        this.sprintFov = this.normalFov + 7; // FOV to use while sprinting
        this.zoomFov = this.normalFov - 50;

        this.typing = false; // Whether the player is typing into the CPU

        this.raycaster = new THREE.Raycaster();
        this.heldItem = null; // The object you are currently holding
        this.holdDistance = 5; // Stores how far away your currently held object is

        this.lastShot = performance.now(); // Last time the blaster was fired
        this.toolPower = 100; // Ammunition

        this.paused = false; // Reflects whether the game is paused

        this.sun = new THREE.DirectionalLight();
        this.sun.intensity = 0.1;
        this.sun.position.set(-10, 50, -10);
        this.sun.castShadow = true;
        this.sun.shadow.camera.left = -50;
        this.sun.shadow.camera.right = 50;
        this.sun.shadow.camera.bottom = -50;
        this.sun.shadow.camera.top = 50;
        this.sun.shadow.camera.near = 0.1;
        this.sun.shadow.camera.far = 100;
        this.game.scene.add(this.sun);
    }

    update(dt) {
        this.physicsUpdate();
        this.cameraUpdate();

        if (!this.paused) {
            this.applyInputs(dt);
            this.updateHeldObject();
            this.updateShooting();
        }
    }

    physicsUpdate() {
        // Keep Player Upright
        this.gameObject.body.quaternion.x = 0;
        this.gameObject.body.quaternion.z = 0;
    }

    // Determine which keys are pressed and store the information
    processInput() {
        // Temporary Sprinting
        if (this.keys[this.controlKeys.sprint]) {
            this.maxSpeed = 12;
            // Slowly bring FOV up
            if (this.camera.fov < this.sprintFov)
                this.camera.fov += 0.5;
            this.camera.updateProjectionMatrix();
        } else {
            this.maxSpeed = 8;
            // Slowly bring FOV back down
            if (this.camera.fov > this.normalFov)
                this.camera.fov -= 0.5;
            this.camera.updateProjectionMatrix();
        }

        if (this.keys[this.controlKeys.zoom]) {
            // Slowly bring FOV down
            if (this.camera.fov > this.zoomFov)
                this.camera.fov -= 4;
            this.camera.updateProjectionMatrix();
            this.controls.pointerSpeed = 0.25;
        } else {
            // Slowly bring FOV back up
            if (this.camera.fov < this.normalFov)
                this.camera.fov += 4;
            this.camera.updateProjectionMatrix();
            this.controls.pointerSpeed = 0.75;
        }

        if (this.keys[this.controlKeys.jump] && this.canJump) {
            this.gameObject.body.applyImpulse(new CANNON.Vec3(0, 3000, 0));
            this.canJump = false;
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
            rotation: this.camera.rotation
        };
    }

    // Moves the player forward and to the right relative to the camera
    move(distanceForward, distanceRight) {
        if (distanceForward != 0 || distanceRight != 0)
            this.gameObject.body.wakeUp();

        let moveVector = new CANNON.Vec3(); // Store movement

        // Forward Movement
        let multiplier = 1;
        moveVector.x += -Math.sin(this.camera.rotation.y) * distanceForward * multiplier;
        moveVector.z += -Math.cos(this.camera.rotation.y) * distanceForward * multiplier;

        // Right Movement
        moveVector.x += -Math.sin(this.camera.rotation.y - Math.PI / 2) * distanceRight * (multiplier * 0.75);
        moveVector.z += -Math.cos(this.camera.rotation.y - Math.PI / 2) * distanceRight * (multiplier * 0.75);

        // Apply Movements
        this.gameObject.body.velocity.x = moveVector.x;
        this.gameObject.body.velocity.z = moveVector.z;
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
        if (Math.abs(difference.x) > 3 || Math.abs(difference.y) > 3 || Math.abs(difference.z) > 3)
            this.camera.position.copy(this.gameObject.body.position);

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

        if (this.toolPower < 100 && timeSinceLastShot > 1000)
            this.toolPower += 1;

        if (this.mouseButtons[this.controlMouseButtons.shoot]) {
            if (timeSinceLastShot > 200 && this.toolPower >= 5) {
                let raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
                NetworkManager.shootRay(raycaster.ray);
                this.lastShot = currentTime; // Store last shot time
                this.toolPower -= 5; // Remove ammunition
                Hand.shootingAnimation();
            }
        }

        UI.setElement("toolPower", this.toolPower);
    }

    updateHeldObject() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.game.scene.children);

        if (intersects.length > 0 && this.mouseButtons[this.controlMouseButtons.hold] && !this.heldItem) {
            this.heldItem = intersects[0].object;
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

    // Locks the mouse to the screen for gameplay
    lockControls() {
        if (!this.controls.isLocked) {
            this.controls.lock();
        }
        document.documentElement.requestFullscreen();
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

        if (event.keyCode == this.controlKeys.type)
            this.typing = !this.typing;

        if (!this.typing)
            this.keys[event.keyCode] = true;
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
        if (this.holdDistance < 2)
            this.holdDistance = 2;
        else if (this.holdDistance > 20)
            this.holdDistance = 20;
    }
}