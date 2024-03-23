const Graphics = require("./graphics");

class CPU {
    constructor(id) {
        this.id = id;
        this.gpu = new Graphics(128, 96);
    }

    getData() {
        return {
            id: this.id,
            pixels: this.gpu.pixels
        };
    }
}

module.exports = CPU;