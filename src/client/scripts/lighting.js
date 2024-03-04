import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameObject } from './classes/GameObject';

export function setupLights(game) {
    let scene = game.scene;
    const sun = new THREE.DirectionalLight();
    sun.intensity = 0.8;
    sun.position.set(-10, 20, -20);
    sun.castShadow = true;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 100;
    sun.shadow.bias = -0.0001;
    sun.shadow.mapSize = new THREE.Vector2(1024, 1024)
    scene.add(sun);
    let visualSun = new GameObject(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0xFFFF00 }),
      new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
      }),
      game
    );
    visualSun.setPosition(sun.position.x, sun.position.y, sun.position.z);
    visualSun.mesh.castShadow = false;
    /*const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
    scene.add(shadowHelper);*/
  
    const ambient = new THREE.AmbientLight();
    ambient.intensity = 0.5;
    scene.add(ambient);
  }