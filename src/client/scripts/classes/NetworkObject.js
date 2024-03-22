import * as Resources from '../Resources.js';

export class NetworkObject {
    infoToSend = {};
    networkId = 0;

    constructor(id, resourceId) {
        this.id = id;
        this.resourceId = resourceId;
        this.object = Resources.objects[resourceId];
    }

    updateFromServer(obj) {
        console.log("updating")
        this.object.position = obj.position;
        this.object.quaternion = obj.quaternion;
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