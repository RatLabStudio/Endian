// Endian Voxel Class
// Rat Lab Studio 2024

import * as CANNON from 'cannon-es';
import { threeToCannon, ShapeType } from 'three-to-cannon';
import * as Resources from './Resources.js';

export class Voxel {
    constructor(game, voxelId) {
        this.game = game;
        this.voxelId = voxelId;

        this.mesh = Resources.voxels[voxelId].mesh;
        this.game.scene.add(this.mesh);

        this.body = new CANNON.Body({ mass: 0 });
        let {shape, offset, orientation} = threeToCannon(this.mesh, {type: ShapeType.BOX});
        this.body.addShape(shape, offset, orientation);
        this.game.world.addBody(this.body);
    }
}