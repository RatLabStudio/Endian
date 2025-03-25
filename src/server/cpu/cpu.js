import { NetworkObject } from "../simulation/objects/NetworkObject.js";
import { Graphics } from "./graphics.js";

export class CPU {
  constructor(id) {
    this.id = id;
    this.gpu = new Graphics(128, 96);
    this.object = new NetworkObject(this.id, "computer");

    this.glitching = false;
    this.lastTick = 0;
  }

  update() {
    if (this.glitching && new Date().getTime() > this.lastTick + 100) {
      let color = `rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
      let yCord = Math.floor(Math.random() * this.gpu.resolutionY);
      for (let i = 0; i < this.gpu.resolutionX; i++) {
        for (let j = yCord; j < yCord + 10 || j < this.gpu.resolutionY; j++) {
          this.gpu.setPixel(i, j, color);
        }
      }
      this.lastTick = new Date().getTime();
    }
  }

  getData() {
    let nextRowData = this.gpu.getNextRowData();
    return {
      id: this.id,
      pixels: nextRowData.pixels,
      rowToUpdate: nextRowData.row,
      resolution: { x: this.gpu.resolutionX, y: this.gpu.resolutionY },
    };
  }
}
