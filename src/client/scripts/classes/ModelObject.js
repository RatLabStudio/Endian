import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelObject {
    constructor(gltfPath, body, game) {
        this.gltfPath = gltfPath;
        this.game = game;

        this.model = null;

        const loader = new GLTFLoader();
        loader.load(this.gltfPath, (gltfScene) => {

            this.model = gltfScene.scene;

            this.model.receiveShadow = true;
            this.model.castShadow = true;

            if (this.game)
                this.game.scene.add(this.model);

        }, undefined, function (error) {
            console.error(error);
        });

        this.body = body;

        this.body.allowSleep = true;
        this.body.sleepSpeedLimit = 1.0;
        this.body.sleepTimeLimit = 0.5;

        if (this.game) {
            this.game.world.addBody(this.body);
            if (this.model)
                this.game.scene.add(this.model);
        }

        this.bodyOffset = {
            x: 0,
            y: 0,
            z: 0
        };
    }

    physicsUpdate() {
        this.model.position.copy(this.body.position);
        this.model.quaternion.copy(this.body.quaternion);
    }

    update() {
        this.physicsUpdate();
    }

    get position() {
        return this.body.position;
    }

    setPosition(x, y, z) {
        if (!this.model)
            return;
        this.body.position.set(x + this.bodyOffset.x, y + this.bodyOffset.y, z + this.bodyOffset.z);
        this.model.position.set(x, y - 1, z);
    }

    setRotation(x, y, z) {
        if (!this.model)
            return;
        //this.body.rotation.set(x, y, z);
        this.model.rotation.set(x, y, z);
    }
}