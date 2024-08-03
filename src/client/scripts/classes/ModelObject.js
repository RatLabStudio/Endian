import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class ModelObject {
  constructor(gltfPath, meshScale, body, game) {
    this.gltfPath = gltfPath;
    this.game = game;

    this.mesh = null;
    this.meshScale = meshScale;

    const loader = new GLTFLoader();
    loader.load(
      this.gltfPath,
      (gltfScene) => {
        this.mesh = gltfScene.scene;
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.scale.set(this.meshScale, this.meshScale, this.meshScale);

        if (this.game) this.game.scene.add(this.mesh);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );

    this.body = body;

    this.body.allowSleep = true;
    this.body.sleepSpeedLimit = 1.0;
    this.body.sleepTimeLimit = 0.5;

    if (this.game) {
      this.game.world.addBody(this.body);
      if (this.mesh) this.game.scene.add(this.mesh);
    }

    this.bodyOffset = {
      x: 0,
      y: 0,
      z: 0,
    };
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
    if (!this.mesh) return;
    this.body.position.set(
      x + this.bodyOffset.x,
      y + this.bodyOffset.y,
      z + this.bodyOffset.z
    );
    this.mesh.position.set(x, y - 1, z);
  }

  setRotation(x, y, z) {
    if (!this.mesh) return;
    //this.body.rotation.set(x, y, z);
    this.mesh.rotation.set(x, y, z);
  }
}
