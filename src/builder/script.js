// Endian Map Builder - Rat Lab Studio 2026

import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let constructs = [];

// FPS Counter Creation
let stats = new Stats();
document.body.append(stats.dom);

/////////////// Scene Setup ///////////////

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(-25, 5, -25);
camera.lookAt(new THREE.Vector3(0, 0, 0));
controls.update();

window.addEventListener("resize", function () {
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

/////////////////////////////////////////////

/////////////// Lighting and Ambiance ///////////////

scene.add(new THREE.AmbientLight(0xffffff, 0.1));

let sun = new THREE.DirectionalLight();
sun.intensity = 0.5;
sun.position.set(-10, 50, -10);
sun.castShadow = true;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.camera.top = 50;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 100;
scene.add(sun);

/////////////////////////////////////////////

// Sets the camera to last stored position if there is data for it from today
function setCameraFromMemory() {
    let date = new Date();
    let currentDate = [date.getMonth() + 1, date.getDate(), date.getFullYear()];

    let setDate = "";
    if (localStorage.getItem("cameraSetTime")) setDate = localStorage.getItem("cameraSetTime").split("-");
    if (setDate.length > 0) {
        if (setDate[2] <= currentDate[2] && setDate[1] <= currentDate[1] && setDate[0] <= currentDate[0]) {
            let pos = localStorage.getItem("cameraPosition").split(",");
            controls.object.position.set(pos[0], pos[1], pos[2]);
            let tar = localStorage.getItem("cameraTarget").split(",");
            controls.target.set(tar[0], tar[1], tar[2]);
        }
    }
}
setCameraFromMemory();

function addConstruct(id, position, rotation) {
    let mesh = null;
    const loader = new GLTFLoader();
    loader.load(
        `assets/model/constructs/${id}.gltf`,
        (gltfScene) => {
            mesh = gltfScene.scene;
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            mesh.scale.set(20, 20, 20);

            mesh.position.set(position.x, position.y + 1.25, position.z);
            mesh.name = `${id}-${constructs.length}`;
            const oldMesh = mesh.getObjectByName('cube'); // Replace 'cube' with whatever it's currently named
            if (oldMesh) {
                oldMesh.name = mesh.name;
            }

            constructs.push(mesh);
            if (scene) scene.add(mesh);
        },
        undefined,
        (error) => {
            console.error(error);
        },
    );
}

addConstruct("conTest", new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));

addConstruct("conTest", new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0, 0));

let selectedObject = null;
let hoveredObject = null;
let grabbing = false;

// Colors
const COLOR_DEFAULT = 0xFFFFFF;
const COLOR_HOVER = 0xDDDDDD;
const COLOR_SELECTED = 0xadd8e6;

// --- 3. RAYCASTING & INTERACTION ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getIntersections(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(scene.children, true);
}

// Handle Mouse Hover
window.addEventListener('pointermove', (event) => {
    const intersects = getIntersections(event);
    if (!grabbing)
        document.body.style.cursor = "grab";

    // Reset previous hovered object (unless it's the currently selected object)
    if (hoveredObject && hoveredObject !== selectedObject) {
        hoveredObject.material.color.setHex(COLOR_DEFAULT);
    }

    if (intersects.length > 0) {
        const topObject = intersects[0].object;

        // Apply hover color if it's not the currently selected object
        if (topObject !== selectedObject) {
            topObject.material.color.setHex(COLOR_HOVER);
            document.body.style.cursor = "pointer";
        }
        hoveredObject = topObject;
    } else {
        hoveredObject = null;
    }
});

// Handle Mouse Click
window.addEventListener('click', (event) => {
    const intersects = getIntersections(event);
    document.getElementById("selected").innerHTML = "None";

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Deselect previously selected object
        if (selectedObject && selectedObject !== clickedObject) {
            selectedObject.material.color.setHex(COLOR_DEFAULT);
        }

        // Update selected object state and color
        selectedObject = clickedObject;
        selectedObject.material.color.setHex(COLOR_SELECTED);
        document.getElementById("selected").innerHTML = selectedObject.name;
    } else {
        // Clicked on empty space: clear selection
        /*if (selectedObject) {
            selectedObject.material.color.setHex(COLOR_DEFAULT);
            selectedObject = null;
        }*/
    }
});

window.addEventListener("mousedown", e => {
    document.body.style.cursor = "grabbing";
    grabbing = true;
});

window.addEventListener("mouseup", e => {
    document.body.style.cursor = "grab";
    grabbing = false;
});

let shift = false;
let speed = 0.01, shiftSpeed = 0.1;

window.addEventListener("keydown", e => {
    switch (e.key) {
        case ("ArrowUp"):
            move("forward");
            break;
        case ("ArrowDown"):
            move("backward");
            break;
        case ("ArrowLeft"):
            move("left");
            break;
        case ("ArrowRight"):
            move("right");
            break;
        case ("Shift"):
            shift = true;
            break;
    }
});

window.addEventListener("keyup", e => {
    if (e.key == "Shift") shift = false;
});

function move(dir) {
    if (!selectedObject) return;

    let s = speed;
    if (shift) s = shiftSpeed;

    switch (dir) {
        case ("forward"):
            selectedObject.position.z += s;
            break;
        case ("backward"):
            selectedObject.position.z -= s;
            break;
        case ("left"):
            selectedObject.position.x += s;
            break;
        case ("right"):
            selectedObject.position.x -= s;
            break;
        case ("up"):
            selectedObject.position.y += s;
            break;
        case ("down"):
            selectedObject.position.y -= s;
            break;
    }
}
document.move = move;

function del() {
    let index = selectedObject.name.split("-")[1];
    scene.remove(constructs[index]);
    constructs[index] = null;
    document.getElementById("selected").innerHTML = "None";
    selectedObject = null;
}
document.del = del;

/////////////// Loop ///////////////

setInterval(async function () {


    // Store Camera Information:
    let cameraPos = controls.object.position;
    localStorage.setItem("cameraPosition", `${cameraPos.x},${cameraPos.y},${cameraPos.z}`);
    let cameraTar = controls.target;
    localStorage.setItem("cameraTarget", `${cameraTar.x},${cameraTar.y},${cameraTar.z}`);
    let date = new Date();
    localStorage.setItem("cameraSetTime", `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`);

    stats.update(); // FPS Counter
    controls.update();
    renderer.render(scene, camera);
}, 0);

/////////////////////////////////////////////