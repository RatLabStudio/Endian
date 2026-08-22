import * as THREE from "three";
import * as CANNON from "cannon-es";

import { GameObject } from "./GameObject.js";
import * as Settings from "../settings.js";

export class Construct {
  constructor(id, instructions, position, quaternion, game) {
    this.id = id;
    this.instructions = instructions;
    this.objs = [];
    this.position = position;
    this.quaternion = quaternion;
    this.game = game;

    for (let i = 0; i < this.instructions.length; i++) {
      let inst = this.instructions[i];
      this.objs[i] = new GameObject(
        new THREE.BoxGeometry(inst.scale.x * 2, inst.scale.y * 2, inst.scale.z * 2),
        new THREE.MeshLambertMaterial({ color: 0x00cccc }),
        new CANNON.Body({
          mass: 0,
          shape: new CANNON.Box(new CANNON.Vec3(inst.scale.x, inst.scale.y, inst.scale.z)),
          material: new CANNON.Material({ friction: 0 }),
        }),
        this.game,
      );
      this.objs[i].setPosition(inst.position.x, inst.position.y, inst.position.z);
    }
  }
}
