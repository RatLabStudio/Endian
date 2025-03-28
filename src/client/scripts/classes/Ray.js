import * as THREE from "three";

import * as Resources from "../Resources.js";

export class Ray {
  constructor(position, direction, game) {
    this.direction = direction;
    this.game = game;

    this.object = new THREE.Group();
    this.object.position.set(position.x, position.y, position.z);

    this.projectile = Resources.createObject("projectile");
    this.object.add(this.projectile.mesh);

    this.light = new THREE.PointLight(0xfffed1, 3);
    this.object.add(this.light);

    this.lights = [new THREE.PointLight(0xfffed1, 3), new THREE.PointLight(0xfffed1, 3), new THREE.PointLight(0xfffed1, 3), new THREE.PointLight(0xfffed1, 3)];

    this.lights[0].position.set(-0.15, 0, 0);
    this.lights[1].position.set(0.15, 0, 0);
    this.lights[2].position.set(0, -0.15, 0);
    this.lights[3].position.set(0, 0.15, 0);

    for (let i = 0; i < this.lights.length; i++) this.object.add(this.lights[i]);

    this.game.scene.add(this.object);
  }

  remove() {
    this.game.scene.remove(this.object);
  }
}
