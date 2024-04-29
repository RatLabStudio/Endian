// Voxel Object Class
// Rat Lab Studio 2024

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import * as Resources from "../Resources.js";

export class Voxel {
    constructor(voxelId) {
        // Get the resource information
        if (Resources.voxels[voxelId])
            this.resource = Resources.voxels[voxelId];
        else // Set to ar if resource does not exist
            this.resource = Resources.voxels.air;

        // Three.js mesh creation
        this.geometry = this.resource.geometry;
        this.material = this.resource.material;
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        // Cannon.js shape creation
        // Note: A full body is not created so the voxel can be added to a body later
        this.shape = this.resource.shape;
    }
}