import * as THREE from "three";
import * as CANNON from "cannon-es";

import { GameObject } from "./GameObject.js";

class objectSet {
  constructor(objs) {
    this.objs = objs;
  }

  update() {
    for (let i = 0; i < this.objs.length; i++) {
      this.objs[i].update();
    }
  }
}

export class Construct {
  constructor(id, objInstructions, position, quaternion, game) {
    this.id = id;
    this.objs = [];
    this.objInstructions = objInstructions;
    /* Objs Layout:
    [
        {
            shape: [0, 0, 0],
            position: new THREE.Vector3(0, 0, 0),
            quaternion: new CANNON.Quaternion(0, 0, 0, 0)
        }
    ]
    */

    // Create GameObjects from instructions
    for (let i = 0; i < objInstructions.length; i++) {
      let inst = objInstructions[i];
      this.objs[i] = new GameObject(
        new THREE.BoxGeometry(inst.shape[0], inst.shape[1], inst.shape[2]),
        new THREE.MeshLambertMaterial({ color: 0x00cccc }),
        new CANNON.Body({
          mass: 0,
          shape: new CANNON.Box(new CANNON.Vec3(inst.shape[0] / 2, inst.shape[1] / 2, inst.shape[2] / 2)),
          material: new CANNON.Material({ friction: 0 }),
        }),
      );
      this.objs[i].setPosition(inst.position.x, inst.position.y, inst.position.z);
    }

    this.object = new objectSet(this.objs);
    this.position = position;
    this.simpleObjs = [];
    //this.quaternion = quaternion;
    this.game = game;

    for (let i = 0; i < this.objs.length; i++) {
      this.objs[i].position.x += this.position.x;
      this.objs[i].position.y += this.position.y;
      this.objs[i].position.z += this.position.z;
      this.simpleObjs[i] = {
        id: this.id + i,
        position: this.objs[i].position,
        quaternion: this.objs[i].quaternion,
        scale: this.objs[i].body.shapes[0].halfExtents,
      };
      this.objs[i].addToGame(this.game);
    }
  }

  // Returns an object containing only necessary data to send to clients
  compress() {
    return {
      id: this.id,
      objs: this.simpleObjs,
      position: this.position,
      quaternion: this.quaternion,
    };
  }

  receiveMovementFromServer(vector) {
    /*this.object.body.velocity.x = 0;
    this.object.body.velocity.y = 0;
    this.object.body.velocity.z = 0;

    this.object.body.angularVelocity.x = 0;
    this.object.body.angularVelocity.y = 0;
    this.object.body.angularVelocity.z = 0;

    let difference = {
      x: vector.position.x - this.object.body.position.x,
      y: vector.position.y - this.object.body.position.y,
      z: vector.position.z - this.object.body.position.z,
    };

    this.object.body.velocity.x = difference.x * 10;
    this.object.body.velocity.y = difference.y * 10;
    this.object.body.velocity.z = difference.z * 10;*/
  }

  resetMass() {
    //this.object.body.mass = this.storedMass;
  }

  get quaternion() {
    //return this.object.quaternion;
  }
}
