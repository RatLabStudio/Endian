import * as THREE from "three";
import * as CANNON from "cannon-es";

let meshes = {
    box: new THREE.BoxGeometry(1, 1, 1)
};

let bodies = {
    box: new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
    })
};