import * as Resources from "../Resources.js";

export class NetworkObject {
  infoToSend = {};
  networkId = 0;

  constructor(id, resourceId) {
    this.id = id;
    this.resourceId = resourceId;
    this.object = null;
    this.loaded = false;
    this.waitingToBeAddedToGame = false;

    this.type = "obj";

    if (Resources.objects[resourceId].gltfPath == null) {
      this.object = Resources.createObject(resourceId);
      this.object.mesh.name = id;
      this.loaded = true;
      this.waitingToBeAddedToGame = true;
    } else {
      this.object = Resources.createModelObject(resourceId, null);
      this.type = "modelObj";
    }
    this.object.body.name = id;
  }

  updateFromServer(obj) {
    if (!this.object.mesh) return;

    if (!this.loaded) {
      this.object.mesh.name = this.id;
      this.loaded = true;
      this.waitingToBeAddedToGame = true;
    }

    // Update Position
    this.object.mesh.position.set(
      obj.position.x,
      obj.position.y,
      obj.position.z
    );

    // For some reason, model objects like to be one unit off on the Y-axis
    if (this.type == "modelObj")
      this.object.mesh.translateOnAxis({ x: 0, y: 1, z: 0 }, -1);

    this.object.mesh.quaternion.set(
      obj.quaternion.x,
      obj.quaternion.y,
      obj.quaternion.z,
      obj.quaternion.w
    );

    // Update Physics Body
    this.object.body.position.set(
      obj.position.x,
      obj.position.y,
      obj.position.z
    );
    this.object.body.quaternion.set(
      obj.quaternion.x,
      obj.quaternion.y,
      obj.quaternion.z,
      obj.quaternion.w
    );
  }

  compress() {
    return {
      id: this.id,
      resourceId: this.resourceId,
      position: this.object.position,
      quaternion: this.object.quaternion,
    };
  }
}
