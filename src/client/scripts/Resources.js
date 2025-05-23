import * as THREE from "three";
import * as CANNON from "cannon-es";

import { GameObject } from "./classes/GameObject.js";
import { ModelObject } from "./classes/ModelObject.js";
import * as Physics from "./physics.js";
import { InstancedObject } from "./classes/InstancedObject.js";

export let objects = {
  box: new GameObject(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshLambertMaterial({ color: 0x00cccc }),
    new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
      material: Physics.groundMaterial,
    })
  ),
  crate: new ModelObject(
    "assets/model/crate.gltf",
    8,
    new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
      material: Physics.groundMaterial,
    })
  ),
  iBox: new InstancedObject(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshLambertMaterial({ color: 0x00cccc }),
    new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
    }),
    1000
  ),
  ball: new GameObject(
    new THREE.SphereGeometry(0.75, 16, 16),
    new THREE.MeshLambertMaterial({ color: 0xff0000 }),
    new CANNON.Body({
      mass: 50,
      shape: new CANNON.Sphere(0.75),
      material: Physics.groundMaterial,
    })
  ),
  floor: new GameObject(
    new THREE.BoxGeometry(60, 5, 60),
    new THREE.MeshLambertMaterial({ color: 0xb6b6b6 }),
    new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(30, 2.5, 30)),
      material: Physics.groundMaterial,
    })
  ),
  player: new ModelObject(
    "assets/model/player.gltf",
    1,
    new CANNON.Body({
      mass: 150,
      shape: new CANNON.Cylinder(0.6, 0.6, 2.5, 8),
      material: Physics.slipperyMaterial,
    })
  ),
  computer: new GameObject(
    new THREE.BoxGeometry(0, 0, 0),
    new THREE.MeshLambertMaterial({ color: 0x808080 }),
    new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(1.25, 1, 0.75)),
      material: Physics.groundMaterial,
    })
  ),
  projectile: new GameObject(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF }),
    new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)),
    })
  ),
};

// This function allows you to create a copy of any of the objects above and returns it
export function createObject(objectId) {
  let resource = objects[objectId];
  return new GameObject(
    resource.geometry,
    resource.material,
    new CANNON.Body({
      mass: resource.body.mass,
      shape: resource.body.shapes[0],
      material: resource.body.material,
      sleepSpeedLimit: 100000,
      sleepTimeLimit: 0,
    })
  );
}

export function createModelObject(objectId, game) {
  let resource = objects[objectId];
  return new ModelObject(
    resource.gltfPath,
    resource.meshScale,
    new CANNON.Body({
      mass: resource.body.mass,
      shape: resource.body.shapes[0],
      material: resource.body.material,
    }),
    game
  );
}
