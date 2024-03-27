const Graphics = require("./graphics");

const Renderer = require("./chip8/scripts/renderer.js");
const Keyboard = require("./chip8/scripts/keyboard.js");
const Speaker = require("./chip8/scripts/speaker.js");
const Chip8 = require("./chip8/scripts/cpu.js");

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();
const chip8 = new Chip8(renderer, keyboard, speaker);

let loop;

let fps = 60, fpsInterval, startTime, now, then, elapsed;

function init() {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    chip8.loadSpritesIntoMemory();
    chip8.loadRom('SNAKE');
    //loop = requestAnimationFrame(step);
}

setInterval(function () {
    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval) {
        chip8.cycle();
    }

    //loop = requestAnimationFrame(step);
}, 1);

init();

class CPU {
    constructor(id) {
        this.id = id;
        this.gpu = new Graphics(128, 96);
    }

    getData() {
        return {
            id: this.id,
            pixels: chip8.renderer.pixels
        };
    }
}

module.exports = CPU;