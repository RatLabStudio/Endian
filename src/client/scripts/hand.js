import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export let hand = {
    object: null,
    player: null
};

// The position that the hand will always return to
let defaultPos = {
    x: 1,
    y: -1.25,
    z: -1.1
};

let defaultRot = {
    x: 0.1,
    y: -0.25,
    z: 0.1
};

let animationSpeeds = {
    position: {
        set: 0.0007,
        return: 0.2
    },
    rotation: {
        set: 0.0004,
        return: 0.08
    }
}

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

function animate() {
    requestAnimationFrame(animate);

    if (hand.object == null)
        return;

    // Modifies the blaster position based on player movement
    if (hand.player.controls.isLocked) {
        // X-Axis
        hand.object.position.x += hand.player.velocity.x * -animationSpeeds.position.set;
        hand.object.rotation.z -= hand.player.velocity.x * -animationSpeeds.rotation.set;

        // Vertical Modification
        hand.object.position.y += hand.player.gameObject.body.velocity.y * -animationSpeeds.position.set;
        hand.object.rotation.x += hand.player.gameObject.body.velocity.y * -animationSpeeds.rotation.set;

        // Z-Axis
        hand.object.position.z += hand.player.velocity.z * animationSpeeds.position.set;
        hand.object.rotation.x += hand.player.velocity.z * animationSpeeds.rotation.set;
    }

    // Returns the hand to the default position over time
    hand.object.position.x += (defaultPos.x - hand.object.position.x) * animationSpeeds.position.return;
    hand.object.position.y += (defaultPos.y - hand.object.position.y) * animationSpeeds.position.return;
    hand.object.position.z += (defaultPos.z - hand.object.position.z) * animationSpeeds.position.return;

    // Returns the hand to the default rotation over time
    hand.object.rotation.x += (defaultRot.x - hand.object.rotation.x) * animationSpeeds.rotation.return;
    hand.object.rotation.y += (defaultRot.y - hand.object.rotation.y) * animationSpeeds.rotation.return;
    hand.object.rotation.z += (defaultRot.z - hand.object.rotation.z) * animationSpeeds.rotation.return;

    // For motion blur
    blurAmount -= 1000;
    if (blurAmount < 0)
        blurAmount = 0;
}
animate();

let blurAmount = 0;
// Apply hand movement
document.addEventListener('mousemove', function (event) {
    if (hand.player == null || !hand.player.controls.isLocked)
        return;

    let mouseDisplacement = {
        x: event.movementX * -0.0006,
        y: event.movementY * 0.0006,
    };

    let max = 0.5;

    hand.object.position.set(
        hand.object.position.x + (Math.abs(mouseDisplacement.x) <= max ? mouseDisplacement.x : max),
        hand.object.position.y + (Math.abs(mouseDisplacement.y) <= max ? mouseDisplacement.y : max),
        hand.object.position.z
    );

    // Motion Blur for fun:
    if (hand.player.controls.isLocked) {
        let disp = Math.abs(mouseDisplacement.x + mouseDisplacement.y);
        if (disp > 0)
            blurAmount += disp * 100;
    }
    /*document.getElementById("game").style.filter = `blur(${blurAmount / (window.innerWidth * 0.003)}px)`;
    document.getElementById("css3d").style.filter = `blur(${blurAmount / (window.innerWidth * 0.003)}px)`;*/
});

export function shootingAnimation() {
    let storedPos = defaultPos.z;
    defaultPos.z += 0.5;
    let storedRot = defaultRot.x;
    defaultRot.x += 0.3;

    hand.player.camera.fov += 5;

    setTimeout(function () {
        defaultPos.z = storedPos;
        defaultRot.x = storedRot;
    }, 50);
}