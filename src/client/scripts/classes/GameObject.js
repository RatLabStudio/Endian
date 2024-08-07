import * as THREE from "three";

export class GameObject {
  constructor(geometry, material, body, game) {
    this.geometry = geometry; // Visual shape of the object
    this.material = material; // Visual material of the object
    this.game = game;

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.body = body;

    this.body.allowSleep = true;
    this.body.sleepSpeedLimit = 1.0;
    this.body.sleepTimeLimit = 0.5;

    if (this.game) {
      this.game.world.addBody(this.body);
      this.game.scene.add(this.mesh);
    }
  }

  physicsUpdate() {
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

  setRotationFromQuaternion(q) {
    // Physics Body
    this.body.quaternion.x = q[0];
    this.body.quaternion.y = q[1];
    this.body.quaternion.z = q[2];
    this.body.quaternion.w = q[3];
    // Three Mesh
    this.mesh.quaternion.x = q[0];
    this.mesh.quaternion.y = q[1];
    this.mesh.quaternion.z = q[2];
    this.mesh.quaternion.w = q[3];
  }
}
