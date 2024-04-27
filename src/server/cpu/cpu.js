import { NetworkObject } from "../simulation/objects/NetworkObject.js";
import { Graphics } from "./graphics.js";

export class CPU {
    constructor(id) {
        this.id = id;
        this.gpu = new Graphics(128, 96);
        this.object = new NetworkObject(this.id, "computer");
    }

    getData() {
        let nextRowData = this.gpu.getNextRowData();
        return {
            id: this.id,
            pixels: nextRowData.pixels,
            rowToUpdate: nextRowData.row,
            resolution: { x: this.gpu.resolutionX, y: this.gpu.resolutionY }
        };
    }
}