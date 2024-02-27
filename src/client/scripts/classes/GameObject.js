import * as THREE from 'three';

export class GameObject {
    constructor(geometry, material, body, game) {
        this.geometry = geometry; // Visual shape of the object
        this.material = material; // Visual material of the object
        this.game = game;

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        game.scene.add(this.mesh);

        this.body = body;
        game.world.addBody(this.body);
    }

    physicsUpdate() {
        let vY = this.body.velocity.y;
        this.body.velocity.y = vY;
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }

    update() {
        this.physicsUpdate();
    }

    get position() {
        return this.body.position;
    }

    setPosition(x, y, z) {
        this.body.position.set(x, y, z);
        this.mesh.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.body.rotation.set(x, y, z);
        this.mesh.rotation.set(x, y, z);
    }
}