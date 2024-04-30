// Voxel Object Class
// Rat Lab Studio 2024

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { Voxel } from './Voxel.js';

export class VoxelObject {
    constructor(game, id) {
        this.id = id;

        // Game contains both the Three.js scene and the Cannon.js world
        this.game = game;

        // 3D Matrix of voxels within the object
        this.matrix = [];
        this.matrixIds = [];

        // Body to store all physics shapes
        this.body = new CANNON.Body({ mass: 0 });
        this.body.sleepSpeedLimit = 100000;
        this.body.sleepTimeLimit = 0;
        this.game.world.addBody(this.body);

        // Group to contain all Three.js meshes
        this.group = new THREE.Group();
        this.game.scene.add(this.group);
    }

    clearMatrix() {
        for (let x = 0; x < this.matrix.length; x++) {
            for (let y = 0; y < this.matrix[x].length; y++) {
                for (let z = 0; z < this.matrix[x][y].length; z++) {
                    this.group.remove(this.matrix[x][y][z].mesh);
                    this.body.removeShape(this.matrix[x][y][z].shape);
                }
            }
        }
    }

    // Set the matrix values of the voxel object and update it accordingly
    setMatrixFromIds(matrix) {
        this.clearMatrix();
        this.matrix = []; // Reset the matrix
        this.matrixIds = [];
        for (let x = 0; x < matrix.length; x++) {
            this.matrix.push([]); // Create Y-Axis
            this.matrixIds.push([]);
            for (let y = 0; y < matrix[x].length; y++) {
                this.matrix[x].push([]); // Create Z-Axis
                this.matrixIds[x].push([]);
                for (let z = 0; z < matrix[x][y].length; z++) {
                    this.matrix[x][y][z] = new Voxel(matrix[x][y][z]); // Create voxel from ID
                    this.matrixIds[x][y][z] = matrix[x][y][z];
                    this.matrix[x][y][z].mesh.position.set(x, y, z)
                    this.group.add(this.matrix[x][y][z].mesh); // Add voxel mesh to Three.js group

                    // Add voxel shape to physics body
                    this.body.addShape(
                        this.matrix[x][y][z].shape, // Shape to add
                        new CANNON.Vec3(x, y, z), // Position to place it at
                        new CANNON.Quaternion().setFromEuler( // Rotation to give the shape
                            this.matrix[x][y][z].mesh.rotation.x,
                            this.matrix[x][y][z].mesh.rotation.y,
                            this.matrix[x][y][z].mesh.rotation.z
                        )
                    );
                }
            }
        }
    }

    get position() {
        return this.body.position;
    }

    setPosition(position) {
        this.group.position.copy(position);
        this.body.position.copy(position);
    }

    get rotation() {
        let euler = new CANNON.Vec3();
        this.body.quaternion.toEuler(euler);
        return euler;
    }

    setRotation(rotation) {
        this.group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
    }

    getData() {
        return {
            id: this.id,
            matrix: this.matrixIds,
            position: this.position,
            rotation: this.rotation
        }
    }
}