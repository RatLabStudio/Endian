import * as Resources from '../Resources.js';

export class NetworkObject {
    infoToSend = {};
    networkId = 0;

    constructor(id, resourceId) {
        this.id = id;
        this.resourceId = resourceId;
        this.object = Resources.createObject(resourceId);
    }

    updateFromServer(obj) {
        // Update Position
        this.object.mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        this.object.mesh.quaternion.set(obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w);

        // Update Physics Body
        this.object.body.position.set(obj.position.x, obj.position.y, obj.position.z);
        this.object.body.quaternion.set(obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w);
    }

    compress() {
        return {
            id: this.id,
            resourceId: this.resourceId,
            position: this.object.position,
            quaternion: this.object.quaternion
        }
    }
}