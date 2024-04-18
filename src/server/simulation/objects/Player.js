import { GameObject } from "./GameObject.js";
import { NetworkObject } from "./NetworkObject.js";

export class Player {
    constructor(networkId) {
        this.networkId = networkId; // Net ID of the player
        this.username = "Player";
        this.object = new NetworkObject("Player", "player").object; // Physical game object of the player
        this.info = {}; // Player information, such as health
    }

    getData() {
        return {
            networkId: this.networkId,
            username: this.username,
            position: this.object.position,
            rotation: this.object.rotation
        };
    }

    updateFromServer(newData) {
        // Update player object
        this.username = newData.username;

        let oldPlayer = this.object;
        let newPlayer = newData;
        let difference = {
            x: newPlayer.position.x - oldPlayer.position.x,
            y: newPlayer.position.y - oldPlayer.position.y + 0.25,
            z: newPlayer.position.z - oldPlayer.position.z,
        };

        oldPlayer.body.wakeUp();

        let acc = 50; // The rate that the player moves toward it's new location at
        oldPlayer.body.velocity.x = difference.x * acc;
        oldPlayer.body.velocity.y = difference.y * acc;
        oldPlayer.body.velocity.z = difference.z * acc;

        oldPlayer.update();

        // Keep player from falling over
        this.object.body.quaternion.x = 0;
        this.object.body.quaternion.y = 0;
        this.object.body.quaternion.z = 0;

        this.object.mesh.rotation.copy(newData.rotation);
    }
}