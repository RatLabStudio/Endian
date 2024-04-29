// Voxel Object Class
// Rat Lab Studio 2024

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class VoxelObject {
    constructor(game) {
        // Game contains both the Three.js scene and the Cannon.js world
        this.game = game;

        // 3D Matrix of voxels within the object
        this.matrix = [];

        // Body to store all physics shapes
        this.body = new CANNON.Body();

        // Group to contain all Three.js meshes
        this.group = new THREE.Group();
        this.game.scene.add(this.group);
    }

    // Set the matrix values of the voxel object and update it accordingly
    setMatrixFromIds(matrix) {
        for (let x = 0; x < matrix.length; x++) {
            for (let y = 0; y < matrix[x].length; y++) {
                for (let z = 0; z < matrix[x][y].length; z++) {

                }
            }
        }
    }

    get position() {
        return this.group.position;
    }

    setPosition(position) {
        this.group.position.copy(position);
        this.body.position.copy(position);
    }

    get rotation() {
        return this.group.rotation;
    }

    setRotation(rotation) {
        this.group.rotation.copy(rotation);
        this.body.quaternion.setFromEuler(rotation);
    }
}