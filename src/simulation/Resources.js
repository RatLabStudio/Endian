import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GameObject } from "./GameObject.js";

export let objects = {
    box: new GameObject(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0x00CCCC }),
        new CANNON.Body({
            mass: 1000,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
        })
    ),
    ball: new GameObject(
        new THREE.SphereGeometry(0.75, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0xFF0000 }),
        new CANNON.Body({
            mass: 1,
            shape: new CANNON.Sphere(0.75)
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
        new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8, 1, false),
        new THREE.MeshNormalMaterial(),
        new CANNON.Body({
            mass: 0,
            shape: new CANNON.Cylinder(0.6, 0.6, 1.5, 8)
        })
    ),
    computer: new GameObject(
        new THREE.BoxGeometry(2.5, 2, 1.5),
        new THREE.MeshLambertMaterial({ color: 0x808080 }),
        new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(1.25, 1, 0.75))
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