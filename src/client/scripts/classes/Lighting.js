// This class is designed to allow me to add a light to the main scene and the GUI scene overlay, 
// so that it can interact with GUI objects and move relative to the player.

import * as THREE from 'three';

export let lightGroup = new THREE.Group();
export let guiLightGroup = new THREE.Group();

export function initializeLighting(game) {
    game.scene.add(lightGroup);
    game.guiScene.add(guiLightGroup);
}

export class Light {
    constructor(light) {
        this.light = light;
        lightGroup.add(this.light);
        this.guiLight = light.clone();
        guiLightGroup.add(this.guiLight);
    }

    get position() { return this.light.position; }

    setPosition(x, y, z) {
        this.light.position.set(x, y, z);
        this.guiLight.position.set(x, y, z);
    }
}

export function updateGuiLights(player) {
    guiLightGroup.position.set(
        player.position.x * -1,
        player.position.y * -1,
        player.position.z * -1
    );
}