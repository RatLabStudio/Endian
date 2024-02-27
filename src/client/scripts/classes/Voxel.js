import * as THREE from 'three';
import { GameObject } from './GameObject';
import * as CANNON from 'cannon-es';

export class Voxel extends GameObject {
    constructor(size, mass, material, game) {
        super(
            new THREE.BoxGeometry(size.x, size.y, size.z),
            material,
            new CANNON.Body({
                mass: mass,
                shape: new CANNON.Box(
                    new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)
                )
            }),
            game);
    }
}