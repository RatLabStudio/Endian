import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let hand = {
    object: null,
    player: null
};

// The position that the hand will always return to
let defaultPos = {
    x: 1,
    y: -1.25,
    z: -1.1
};

const loader = new GLTFLoader();
export function loadHand(scene, player) {
    loader.load('assets/model/tools/blaster.gltf', (gltfScene) => {

        gltfScene.scene.receiveShadow = true;
        gltfScene.scene.castShadow = true;

        scene.add(gltfScene.scene);
        hand.object = gltfScene.scene;
        hand.player = player;

        hand.object.position.set(defaultPos.x, defaultPos.y, defaultPos.z);
        hand.object.rotation.set(0.1, -0.25, 0.1);

    }, undefined, function (error) {
        console.error(error);
    });
}

setInterval(function () {
    if (hand.object == null)
        return;

    // Modifies the blaster position based on player movement
    if (hand.player.controls.isLocked) {
        hand.object.position.x += hand.player.velocity.x * -0.001;
        if (hand.object.position.y < -1)
            hand.object.position.y += hand.player.gameObject.body.velocity.y * -0.0001;
        hand.object.position.z += hand.player.velocity.z * 0.001;
    }

    // Returns the hand to the default position over time
    hand.object.position.x += (defaultPos.x - hand.object.position.x) * 0.1;
    hand.object.position.y += (defaultPos.y - hand.object.position.y) * 0.1;
    hand.object.position.z += (defaultPos.z - hand.object.position.z) * 0.1;
}, 1);

// Apply hand movement
document.addEventListener('mousemove', function (event) {
    if (!hand.player.controls.isLocked)
        return;

    hand.object.position.set(
        hand.object.position.x + event.movementX * -0.001,
        hand.object.position.y + event.movementY * 0.001,
        hand.object.position.z
    );
});