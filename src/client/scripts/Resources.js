import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GameObject } from "./classes/GameObject.js";

export let objects = {
    box: new GameObject(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshNormalMaterial(),
        new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
        })
    ),
    floor: new GameObject(
        new THREE.BoxGeometry(60, 5, 60),
        new THREE.MeshLambertMaterial({ color: 0xB6B6B6 }),
        new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(30, 2.5, 30))
        })
    ),
    player: new GameObject(
        new THREE.CylinderGeometry(0.45, 0.45, 2.5, 8, 1, false),
        new THREE.MeshNormalMaterial(),
        new CANNON.Body({
            mass: 0,
            shape: new CANNON.Cylinder(0.45, 0.45, 2.5, 8),
        })
    ),
    computer: new GameObject(
        new THREE.BoxGeometry(3, 2, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x808080 }),
        new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(1.5, 1, 0.1))
        })
    )
}

// This function allows you to create a copy of any of the objects above and returns it
export function createObject(objectId) {
    let resource = objects[objectId];
    return new GameObject(
        resource.geometry,
        resource.material,
        new CANNON.Body({
            mass: resource.body.mass,
            shape: resource.body.shapes[0]
        })
    );
}