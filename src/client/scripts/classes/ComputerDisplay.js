// Computer.js
// Copyright Rat Lab Studio 2024

// This class creates a display for the ship computer

// NOTE: This class contains a TON of debug code, such as the model for the computer
//          This code is not final!

import * as THREE from 'three';
import * as CSS3DRenderer from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as Lighting from './Lighting.js';

const loader = new GLTFLoader();

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
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
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
        this.material = new THREE.MeshLambertMaterial({ color: 0x000000 });
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

        this.model = null;

        loader.load('assets/model/monitor.gltf', (gltfScene) => {

            this.model = gltfScene.scene;

            this.model.receiveShadow = true;
            this.model.castShadow = true;

            this.model.position.set(
                this.object.position.x,
                this.object.position.y - 0.95,
                this.object.position.z - 0.69,
            );
            this.model.scale.set(2.75, 2.75, 2.75)
            this.model.rotation.y = Math.PI;

            this.scene.add(this.model);

        }, undefined, function (error) {
            console.error(error);
        });

        this.light = new Lighting.Light(new THREE.PointLight(0xFFFFFF, 10, 8, 2));

        this.setPosition(0, 0, 0); // Sets a default position for the computer at 0, 0, 0

        this.currentRow = 0;
        this.lastRowSet = performance.now();
        this.newPixels = [];
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

        if (this.model) {
            this.model.position.set(
                this.object.position.x,
                this.object.position.y - 0.95,
                this.object.position.z - 0.69,
            );
            this.model.scale.set(2.75, 2.75, 2.75)
            this.model.rotation.y = Math.PI;
        }

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

    checkForNewPixels(array1, array2) {
        // Check if the arrays have the same dimensions.
        if (array1.length !== array2.length || array1[0].length !== array2[0].length)
            return 0;
        // Iterate over the arrays and compare each element.
        for (let i = 0; i < array1.length; i++) {
            for (let j = 0; j < array1[0].length; j++) {
                if (array1[i][j] !== array2[i][j])
                    return i;
            }
        }
        // If all elements are equal, return false.
        return false;
    }

    // Sets the display array for the monitor to begin updating to
    setDisplayFrom2DArray(arr) {
        let newRow = this.checkForNewPixels(arr, this.newPixels);
        if (!arr || newRow === false)
            return;
        this.newPixels = arr;
        //if (performance.now() - this.lastRowSet > 1000) {
        this.currentRow = newRow;
        this.lastRowSet = performance.now();
        //}
    }

    // Clears a given row
    clearRow(row) {
        this.ctx.clearRect(0, row * this.scale, this.canvas.width, this.scale);
    }

    // Prints the scan line
    printScanLine() {
        this.ctx.fillStyle = "rgba(255,255,255,0.1)";
        this.ctx.fillRect(0, this.currentRow * this.scale, this.canvas.width, this.scale);
    }

    // Updates a given row to reflect that of this.newPixels
    updateRow(row) {
        if (this.newPixels.length <= 0)
            return;
        this.clearRow(row);
        for (let i = 0; i < this.width; i++)
            this.setPixel(i, row, this.newPixels[row][i]);
    }

    // Updates the next row and advances the scan line
    updateNextRow() {
        if (this.newPixels.length <= 0)
            return;

        this.updateRow(this.currentRow);

        if (this.currentRow < this.height - 1)
            this.currentRow++;
        else
            this.currentRow = 0;
        //this.printScanLine();
    }

    // Updates the PointLight to reflect the contents of the screen
    updateLight() {
        let avg = {
            red: 0,
            green: 0,
            blue: 0
        };

        let imgData = this.ctx.getImageData(0, 0, this.width, this.height).data;
        avg.red = imgData[0];
        avg.green = imgData[1];
        avg.blue = imgData[2];

        this.light.setColor(avg.red / 255 + 0.05, avg.green / 255 + 0.05, avg.blue / 255 + 0.05);
    }
}