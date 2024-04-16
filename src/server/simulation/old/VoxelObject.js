// Endian Voxel Object Class
// Rat Lab Studio 2024

import * as Resources from '../Resources.js';

export class VoxelObject {
    constructor(game) {
        this.game = game;

        this.voxels = [[[]]]; // 3D Array of voxels contained by the object
    }

    setVoxel(x, y, z, voxelId) {
        this.voxels[x][y][z] = Resources.voxels[voxelId];
    }
}