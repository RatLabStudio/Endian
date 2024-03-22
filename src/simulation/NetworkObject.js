import * as Resources from "./Resources.js";
import { GameObject } from "./GameObject.js";

export class NetworkObject {
    constructor(id, resourceId) {
        this.id = id;
        this.resourceId = resourceId;
        this.object = Resources.objects[resourceId];
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