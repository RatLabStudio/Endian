import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameObject } from './GameObject';
const matrix = new THREE.Matrix4();

export class InstancedObject extends GameObject {
    constructor(geometry, material, body, count) {
        super(geometry, material, body);
        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        this.index = 0;
        this.objs = [];
    }

    createObject(world) {
        let temp = new THREE.Object3D();
        temp.updateMatrix();
        this.mesh.setMatrixAt(this.index, temp.matrix);
        this.objs[this.index] = new CANNON.Body({
            mass: this.body.mass,
            shape: this.body.shapes[0]
        });
        this.objs[this.index].allowSleep = true;
        world.addBody(this.objs[this.index]);
        this.index++;
        return this.index - 1;
    }

    updateMatrix(index, transform) {
        this.mesh.getMatrixAt(index, matrix);

        let temp = new THREE.Object3D();
        matrix.decompose(temp.position, temp.rotation, temp.scale);
        temp = transform;
        temp.updateMatrix();

        this.mesh.setMatrixAt(index, temp.matrix);
    }

    addToGame(game) {
        this.game = game;
        this.game.scene.add(this.mesh);
    }

    physicsUpdate() {
        this.mesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < this.objs.length; i++) {
            let transform = new THREE.Object3D();
            transform.position.copy(this.objs[i].position);
            transform.quaternion.copy(this.objs[i].quaternion);
            this.updateMatrix(i, transform);
        }
    }
}