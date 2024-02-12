import * as THREE from 'three';

export class GameObject {
    constructor(geometry, material, scene) {
        this.geometry = geometry; // Visual shape of the object
        this.material = material; // Visual material of the object
        this.scene = scene;

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        scene.add(this.mesh);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.mesh.rotation.set(x, y, z);
    }
}