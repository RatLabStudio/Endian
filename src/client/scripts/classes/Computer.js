// Computer.js
// Copyright Rat Lab Studio 2024

// This class creates a display for the ship computer

// NOTE: This class contains a TON of debug code, such as the model for the computer
//          This code is not final!

import * as THREE from 'three';
import * as CSS3DRenderer from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as CANNON from 'cannon-es';

import { font } from '../font.js';

import * as Lighting from './Lighting.js';

export class Computer {
    constructor(game, cssScene) {
        this.game = game;
        this.scene = game.scene;
        this.cssScene = cssScene;

        this.position = {
            x: 0,
            y: 0,
            z: 0
        };

        this.width = 128; // X Resolution
        this.height = 96; // Y Resolution

        this.scale = 3; // Scale of the entire computer

        this.textPos = { // FOR TEXT DEBUGGING
            x: 0,
            y: 0
        };

        this.group = new THREE.Group();

        // Create HTML Element for display
        this.div = document.createElement("div");
        this.div.className = "computerDisplay";
        this.div.style.width = this.width * this.scale + "px";
        this.div.style.height = this.height * this.scale + "px";

        // Create HTML canvas for drawing
        this.canvas = document.createElement("canvas");
        this.canvas.className = "displayCanvas";
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.div.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        // Create Screen Overlay
        this.overlay = document.createElement("div");
        this.overlay.className = "displayOverlay";
        this.div.appendChild(this.overlay);

        // Create CSS3D Object
        this.object = new CSS3DRenderer.CSS3DObject(this.div);
        this.object.scale.multiplyScalar(0.005);
        this.object.position.set(this.position.x, this.position.y, this.position.z);
        this.object.rotation.x = 0;
        this.group.add(this.object);

        // Create GL plane
        this.material = new THREE.MeshLambertMaterial({ color: 0x0000FF });
        this.material.side = THREE.DoubleSide;
        this.material.opacity = 0;
        this.material.transparent = true;
        this.material.blending = THREE.NoBlending; // allows the GL plane to occlude the CSS plane

        this.geometry = new THREE.PlaneGeometry(this.width * this.scale, this.height * this.scale);

        this.meshBlend = new THREE.Mesh(this.geometry, this.material);
        this.meshBlend.position.copy(this.object.position);
        this.meshBlend.rotation.copy(this.object.rotation);
        this.meshBlend.scale.copy(this.object.scale);

        this.scene.add(this.meshBlend);
        this.cssScene.add(this.group);

        this.computerObject = new THREE.Group(); // Group of computer model components
        let computerMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });

        // All the parts of the computer
        this.computerParts = {
            body: new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.006 * this.scale, this.height * 0.006 * this.scale, 0.05 * this.scale), computerMaterial),
            bezelTop: new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.006 * this.scale, this.height * 0.0005 * this.scale, 0.05 * this.scale), computerMaterial),
            bezelBottom: new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.006 * this.scale, this.height * 0.0005 * this.scale, 0.05 * this.scale), computerMaterial),
            bezelLeft: new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.0005 * this.scale, this.height * 0.006 * this.scale, 0.05 * this.scale), computerMaterial),
            bezelRight: new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.0005 * this.scale, this.height * 0.006 * this.scale, 0.05 * this.scale), computerMaterial),
            back: new THREE.Mesh(new THREE.BoxGeometry(this.width * 0.004 * this.scale, this.height * 0.004 * this.scale, 0.05 * this.scale), computerMaterial),
        }

        // Add all parts to the group
        let cKeys = Object.keys(this.computerParts);
        for (let i = 0; i < cKeys.length; i++)
            this.computerObject.add(this.computerParts[cKeys[i]]);

        this.computerObject.position.set(this.position.x, this.position.y, this.position.z - 0.2505);
        this.computerObject.castShadow = true;
        this.scene.add(this.computerObject);

        // Add physics box to computer
        this.physicsBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(this.width * 0.01, this.height * 0.01, 0.2))
        });
        this.physicsBody.position.set(this.position.x, this.position.y, this.position.z);

        this.game.world.addBody(this.physicsBody);

        this.light = new Lighting.Light(new THREE.PointLight(0x0000FF, 10, 8, 2));

        this.setPosition(0, 0, 0); // Sets a default position for the computer at 0, 0, 0
    }

    // Move the computer and all its components to a specified location
    setPosition(x, y, z) {
        this.position = {
            x: x,
            y: y,
            z: z
        };

        this.object.position.set(this.position.x, this.position.y, this.position.z);
        this.meshBlend.position.copy(this.object.position);

        this.computerParts.body.position.set(
            this.position.x,
            this.position.y,
            this.position.z + 0.175
        );
        this.computerParts.bezelTop.position.set(
            this.position.x,
            this.position.y + (this.height * 0.0275) - 1.85,
            this.position.z + 0.25
        );
        this.computerParts.bezelBottom.position.set(
            this.position.x,
            this.position.y - this.height * 0.0275 + 1.85,
            this.position.z + 0.25
        );
        this.computerParts.bezelLeft.position.set(
            this.position.x - this.width * 0.0275 + 2.45,
            this.position.y,
            this.position.z + 0.25
        );
        this.computerParts.bezelRight.position.set(
            this.position.x + this.width * 0.0275 - 2.45,
            this.position.y,
            this.position.z + 0.25
        );
        this.computerParts.back.position.set(
            this.position.x,
            this.position.y,
            this.position.z
        );

        this.physicsBody.position.set(
            this.position.x,
            this.position.y,
            this.position.z - 0.1
        );

        this.light.setPosition(
            this.position.x, 
            this.position.y, 
            this.position.z + 0.5
        );
    }

    // Clear entire screen of the display
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Set a specific pixel at (x, y) to be active or inactive
    setPixel(x, y, color) {
        if (color == true)
            color = 'white';
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
        } else {
            this.ctx.clearRect(x * this.scale, y * this.scale, this.scale, this.scale);
        }
    }

    // Displays Rat Lab Studio in pixel text
    displayTestMessage() {
        // I'm sorry, I wanted to do it quickly...
        let message = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

        this.clear();
        for (let i = 0; i < message.length; i++) {
            for (let j = 0; j < message[i].length; j++) {
                if (message[i][j] === 1)
                    this.setPixel(j, i, true);
            }
        }
    }

    // Prints a character to the screen
    printCharacter(char) {
        char = font[char];
        for (let i = 0; i < char.length; i++) {
            for (let j = 0; j < char[i].length; j++) {
                if (char[i][j] === 1)
                    this.setPixel(j + this.textPos.x, i + this.textPos.y, true);
            }
        }
        this.textPos.x += char[0].length + 1;
    }

    // Prints a string of characters to the screen
    printString(str) {
        str = str.toLowerCase();
        for (let i = 0; i < str.length; i++) {
            let char = str[i];
            if (char == ' ') char = 'space';
            else if (char == ':') char = 'colon';
            else if (char == '!') char = 'exclamation';
            this.printCharacter(char);
        }
    }

    // Moves the cursor to the start of the next line
    nextLine() {
        this.textPos.x = 0;
        this.textPos.y += 7;
    }
}