import * as Resources from "./Resources.js";

export class NetworkObject {
    constructor(id, resourceId) {
        this.id = id;
        this.resourceId = resourceId;

        this.playerMovable = false;
        this.justMoved = false;
        this.storedMass = 0;

        this.object = Resources.createObject(resourceId);
        this.object.mesh.name = id;
    }

    compress() {
        return {
            id: this.id,
            resourceId: this.resourceId,
            position: this.object.position,
            quaternion: this.object.quaternion
        }
    }

    receiveMovementFromServer(vector) {
        this.object.body.velocity.x = 0;
        this.object.body.velocity.y = 0;
        this.object.body.velocity.z = 0;

        this.object.body.angularVelocity.x = 0;
        this.object.body.angularVelocity.y = 0;
        this.object.body.angularVelocity.z = 0;

        let difference = {
            x: vector.position.x - this.object.body.position.x,
            y: vector.position.y - this.object.body.position.y,
            z: vector.position.z - this.object.body.position.z
        };

        this.object.body.velocity.x = difference.x * 10;
        this.object.body.velocity.y = difference.y * 10;
        this.object.body.velocity.z = difference.z * 10;
    }

    resetMass() {
        this.object.body.mass = this.storedMass;
    }
}