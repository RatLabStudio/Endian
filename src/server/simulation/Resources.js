import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GameObject } from "./objects/GameObject.js";
import { InstancedObject } from "./objects/InstancedObject.js";

export let objects = {
  box: new GameObject(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshLambertMaterial({ color: 0x00cccc }),
    new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
    })
  ),
  crate: new GameObject(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshLambertMaterial({ color: 0x00cccc }),
    new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
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
    })
  ),
  floor: new GameObject(
    new THREE.BoxGeometry(60, 5, 60),
    new THREE.MeshLambertMaterial({ color: 0xb6b6b6 }),
    new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(30, 2.5, 30)),
      material: new CANNON.Material({ friction: 0 }),
    })
  ),
  player: new GameObject(
    new THREE.CylinderGeometry(0.45, 0.45, 2.5, 8, 1, false),
    new THREE.MeshNormalMaterial(),
    new CANNON.Body({
      mass: 150,
      shape: new CANNON.Cylinder(0.6, 0.6, 2.5, 8),
      material: new CANNON.Material({ friction: 10 }),
    })
  ),
  computer: new GameObject(
    new THREE.BoxGeometry(2.5, 2, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x808080 }),
    new CANNON.Body({
      mass: 50,
      shape: new CANNON.Box(new CANNON.Vec3(1.25, 1, 0.75)),
    })
  ),
  projectile: new GameObject(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshLambertMaterial({ color: 0x00cccc }),
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
    })
  );
}
