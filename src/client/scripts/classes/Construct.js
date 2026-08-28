import * as THREE from "three";
import * as CANNON from "cannon-es";

import { GameObject } from "./GameObject.js";
import * as Settings from "../settings.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Construct {
  constructor(id, instructions, position, quaternion, game) {
    this.id = id; // This determines the model to use
    this.instructions = instructions;
    this.objs = [];
    this.position = position;
    this.quaternion = quaternion;
    this.game = game; // Contains scene and physics world
    this.meshScale = 20; // Overall model scale, hard-coded after testing

    // Build objects from instructions
    for (let i = 0; i < this.instructions.length; i++) {
      let inst = this.instructions[i];
      this.objs[i] = new GameObject(
        new THREE.BoxGeometry(inst.scale.x * 2, inst.scale.y * 2, inst.scale.z * 2),
        new THREE.MeshLambertMaterial({ color: 0x00cccc, transparent: true, opacity: 0.0 }),
        new CANNON.Body({
          mass: 0,
          shape: new CANNON.Box(new CANNON.Vec3(inst.scale.x, inst.scale.y, inst.scale.z)),
          material: new CANNON.Material({ friction: 0 }),
        }),
        this.game,
      );
      this.objs[i].setPosition(inst.position.x, inst.position.y, inst.position.z);
    }

    // Render the construct according to visibility setting
    if (Settings.settings.renderconstructs == 1) this.render(true);
    else this.render(false);
  }

  render(useModel) {
    // Renders the basic bounding shapes of the construct
    if (!useModel) {
      for (let i = 0; i < this.objs.length; i++) {
        this.objs[i].mesh.material.opacity = 1;
      }
      return;
    }

    // Renders the 3D facade for the construct
    this.mesh = null;
    const loader = new GLTFLoader();
    loader.load(
      `../../assets/model/constructs/${this.id}.gltf`,
      (gltfScene) => {
        this.mesh = gltfScene.scene;
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.scale.set(this.meshScale, this.meshScale, this.meshScale);

        this.mesh.position.set(this.position.x, this.position.y + 1.25, this.position.z);

        if (this.game) this.game.scene.add(this.mesh);
      },
      undefined,
      (error) => { // Revert to basic rendering if model doesn't work
        console.log(error);
        this.render(false);
      },
    );
  }
}
