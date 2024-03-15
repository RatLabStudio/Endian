import * as THREE from 'three';
import * as CSS3DRenderer from 'three/examples/jsm/renderers/CSS3DRenderer';

export class vCpu {
    constructor(x, y, z, w, h, rX, scene, cssScene) {
        this.scene = scene;
        this.cssScene = cssScene;
        this.width = w;
        this.height = h;
        this.group = new THREE.Group();
        this.div = document.createElement("div");
        this.div.style.width = this.width + "px";
        this.div.style.height = this.height + "px";
        this.div.style.backgroundColor = "#000";
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width + ''; this.canvas.height = this.height + '';
        this.canvas.style.backgroundColor = 'blue';
        this.canvas.style.borderStyle = 'solid';
        this.canvas.style.borderWidth = '2px';
        this.div.appendChild(this.canvas);
        this.object = new CSS3DRenderer.CSS3DObject(this.div);
        this.object.scale.multiplyScalar(0.003);
        this.object.position.set(x, y, z);
        this.object.rotation.x = rX;
        this.group.add(this.object);
        // Create GL plane
        this.material = new THREE.MeshLambertMaterial();
        this.material.side = THREE.DoubleSide;
        this.material.opacity = 0;
        this.material.transparent = true;
        this.material.blending = THREE.NoBlending; // allows the GL plane to occlude the CSS plane
        this.geometry = new THREE.PlaneGeometry(this.width, this.height);
        this.meshBlend = new THREE.Mesh(this.geometry, this.material);
        this.meshBlend.position.copy(this.object.position);
        this.meshBlend.rotation.copy(this.object.rotation);
        this.meshBlend.scale.copy(this.object.scale);
        this.scene.add(this.meshBlend);
        this.cssScene.add(this.group);
        this.ctx = this.canvas.getContext('2d');
        this.objs = [];

        this.textLine = 1;
        this.caret = new cSquare(30, getLineY(1, 42) - 38, 5, 42, this);
        this.currentText = null;
        this.textLines = [''];

        this.cmd = false;
    }
    redraw(delta) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i = 0; i < this.objs.length; i++)
            this.objs[i].draw();
        if (Math.floor(delta) % 2 == 0)
            this.caret.w = 0;
        else
            this.caret.w = 5;
    }
    clearAll() {
        this.objs = [];
    }
    clearText() {
        let texts = [];
        // Get a list of all text array indexes
        for (var i = 0; i < this.objs.length; i++) {
            if (this.objs[i].type = 'cText')
                texts.push(i);
        }
        // Delete them and shift the other indexes for each
        for (var i = 0; i < texts.length; i++) {
            this.objs.splice(texts[i], 1);
            for (var j = i; j < texts.length; j++) {
                if (texts[j] > texts[i])
                    texts[j]--;
            }
        }
        this.textLine = 1;
        this.textLines = [''];
        this.caret = new cSquare(30, getLineY(1, 42) - 38, 5, 42, this);
    }
    createCSquare(x, y, w, h) {
        let tempObj = new cSquare(x, y, w, h, this);
    }
    createText(text, size, family, color) {
        let tempText = new cText(text, size, family, color, this);
        this.textLine++;
        this.caret.x = size / 2 * text.length + 5;
        this.caret.y = getLineY(this.textLine, size);
    }
    newLine() {
        this.textLines[this.textLine] = this.currentText;
        this.textLine++;
        if (this.textLine > 7)
            this.clearText();
        this.currentText = new cText("", 42, 'sans-serif', 'aliceblue', this);
        this.caret.y = getLineY(this.textLine, 42) - 32;
        this.caret.x = this.currentText.x;
    }
    type(char, ignoreCommand) {
        if (this.currentText == null)
            this.currentText = new cText("", 42, 'sans-serif', 'aliceblue', this);
        if (char == 'Enter') {
            if (this.currentText.text.toLowerCase() == 'cmd' && !ignoreCommand) {
                this.cmd = true;
                this.type('Enter', true);
                this.typeString("Command Prompt:");
                this.type('Enter', true);
            }
            else if (this.cmd && !ignoreCommand)
                this.enterCommand(this.currentText.text);
            this.newLine();
        }
        else if (char == 'Backspace') {
            if (this.currentText.text.length == 0 && this.textLine > 1) {
                this.textLine--;
                this.currentText = this.textLines[this.textLine];
                this.caret.y = getLineY(this.textLine, 42) - 32;
                this.caret.x = this.ctx.measureText(this.currentText.text).width + this.currentText.size / 2;
            }
            else {
                this.currentText.text = this.currentText.text.substring(0, this.currentText.text.length - 1);
                this.caret.x = this.ctx.measureText(this.currentText.text).width + this.currentText.size / 2;
            }
        }
        else if (char.length == 1) {
            this.currentText.text += char;
            this.caret.x = this.ctx.measureText(this.currentText.text).width + this.currentText.size / 2;
        }
    }
    typeString(string) {
        for (var i = 0; i < string.length; i++) {
            this.type(string[i]);
        }
    }
    enterCommand(command) {
        if (command == 'test') {
            this.type("Enter", true);
            this.typeString('Hello, World!');
        }
    }
}
class cSquare {
    constructor(x, y, w, h, cpu) {
        this.type = 'obj';
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.cpu = cpu;
        this.ctx = this.cpu.canvas.getContext("2d");
        this.cpu.objs.push(this);
        this.draw();
    }
    draw() {
        this.ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}
function getLineY(line, fontSize) {
    return ((fontSize * 1.25) * (line - 1)) + fontSize * 1.75;
}
class cText {
    constructor(text, size, family, color, cpu) {
        this.type = 'cText';
        this.text = text;
        this.size = size;
        this.x = size / 2;
        this.family = family;
        this.color = color;
        this.cpu = cpu;
        this.line = this.cpu.textLine;
        this.y = getLineY(this.line, this.size);
        this.cpu.objs.push(this);
        this.draw();
    }
    draw() {
        this.cpu.ctx.font = this.size + 'px ' + this.family;
        this.cpu.ctx.fillStyle = this.color;
        this.cpu.ctx.fillText(this.text, this.x, this.y);
    }
}