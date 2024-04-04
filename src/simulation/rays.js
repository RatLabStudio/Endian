import * as THREE from "three";
import * as NetworkManager from './NetworkManager.js';

export let rays = {};
export let raySpeed = 0.5;
export let hitBoxOffset = 0.5;
export let maxRayDistance = 100;

export function manageRays() {
    for (let i = 0; i < NetworkManager.rays.length; i++) {
        if (!NetworkManager.playerObjs[NetworkManager.rays[i].sender])
            return;

        if (!rays[NetworkManager.rays[i].id]) {
            // Store the ray for updating
            rays[NetworkManager.rays[i].id] = NetworkManager.rays[i];
            rays[NetworkManager.rays[i].id].position = 0;

            // Reconstruct the ray with the provided data
            let reconstructedRaycaster = new THREE.Raycaster(
                new THREE.Vector3(
                    rays[NetworkManager.rays[i].id].ray.origin.x,
                    rays[NetworkManager.rays[i].id].ray.origin.y,
                    rays[NetworkManager.rays[i].id].ray.origin.z
                ),
                new THREE.Vector3(
                    rays[NetworkManager.rays[i].id].ray.direction.x,
                    rays[NetworkManager.rays[i].id].ray.direction.y,
                    rays[NetworkManager.rays[i].id].ray.direction.z
                )
            );

            rays[NetworkManager.rays[i].id].raycaster = reconstructedRaycaster;

            //scene.add(new THREE.ArrowHelper(rays[NetworkManager.rays[i].id].raycaster.ray.direction, rays[NetworkManager.rays[i].id].raycaster.ray.origin, 300, 0xFF0000));
        }
    }
}

export function updateRays(scene) {
    let rayKeys = Object.keys(rays);
    for (let i = 0; i < rayKeys.length; i++) {
        try {
            if (rays[rayKeys[i]] == undefined)
                return
            rays[rayKeys[i]].position += raySpeed;
        }
        catch {
            console.error(`Unable to set position of ray ${rayKeys[i]}`);
            console.log(rays[rayKeys[i]])
            return;
        }

        // Kill the ray if it gets too far away
        if (rays[rayKeys[i]].position > maxRayDistance) {
            delete rays[rayKeys[i]];
            NetworkManager.sendRayDisplayInfo(rays);
            return;
        }

        // Check if ray hits an object at it's current position
        let intersections = rays[rayKeys[i]].raycaster.intersectObjects(scene.children);
        //console.log(intersections);
        for (let i = 0; i < intersections.length; i++) {
            // See if the ray at its distance is within the bounds of the intersected object
            if (rays[rayKeys[i]] && intersections[i].distance < rays[rayKeys[i]].position + hitBoxOffset && intersections[i].distance > rays[rayKeys[i]].position - hitBoxOffset) {
                if (intersections[i].object.name == '')
                    continue; // Continue to next intersection

                let shotPlayer = NetworkManager.players[intersections[i].object.name.replace("player", "")];
                if (shotPlayer) {
                    NetworkManager.playerInfo[shotPlayer.networkId].health -= 5;
                    if (NetworkManager.playerInfo[shotPlayer.networkId].health <= 0)
                        NetworkManager.sendChatMessage(`${shotPlayer.username} was killed by ${NetworkManager.players[rays[rayKeys[i]].sender].username}`, "white");
                    //console.log(`${NetworkManager.players[rays[rayKeys[i]].sender].username} shot ${shotPlayer.username}`)
                } else {
                    //console.log(`${NetworkManager.players[rays[rayKeys[i]].sender].username} HIT ${intersections[i].object.name}`);
                }

                delete rays[rayKeys[i]];
                break;
            }
        }
    }

    NetworkManager.sendRayDisplayInfo(rays);
}