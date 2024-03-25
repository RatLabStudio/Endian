const font = require("./font");

class Graphics {
    constructor(resolutionX, resolutionY) {
        this.pixels = [];

        this.resolutionX = resolutionX;
        this.resolutionY = resolutionY;

        for (let row = 0; row < resolutionY; row++) {
            this.pixels.push([]);
            for (let col = 0; col < resolutionX; col++)
                this.pixels[row][col] = 0;
        }

        this.textPos = { // FOR TEXT DEBUGGING
            x: 0,
            y: 0
        };
    }

    clear() {
        for (let row = 0; row < resolutionY; row++) {
            this.pixels.push([]);
            for (let col = 0; col < resolutionX; col++)
                this.pixels[row][col] = 0;
        }
    }

    setPixel(x, y, active) {
        this.pixels[y][x] = active;
    }

    // Prints a character to the screen
    printCharacter(char) {
        if (char == " ") char = "space";
        else if (char == ":") char = "colon";
        else if (char == "!") char = "exclamation";
        else if (char == ".") char = "dot";

        for (let i = this.textPos.x + 1; i < this.textPos.x + 2; i++) {
            for (let j = this.textPos.y; j < this.textPos.y + 5; j++)
                this.setPixel(i, j, false);
        }

        char = font[char.toLowerCase()];
        if (!char)
            return;

        for (let i = 0; i < char.length; i++) {
            for (let j = 0; j < char[i].length; j++) {
                if (char[i][j] === 1)
                    this.setPixel(j + this.textPos.x, i + this.textPos.y, "lime");
            }
        }

        this.textPos.x += char[0].length + 1;

        if (this.textPos.x >= this.resolutionX - 3)
            this.nextLine();

        for (let i = this.textPos.x + 1; i < this.textPos.x + 2; i++) {
            for (let j = this.textPos.y; j < this.textPos.y + 5; j++)
                this.setPixel(i, j, true);
        }
    }

    // Prints a string of characters to the screen
    printString(str) {
        str = str.toLowerCase();
        for (let i = 0; i < str.length; i++) {
            let char = str[i];
            if (char == ' ') char = 'space';
            else if (char == ':') char = 'colon';
            else if (char == '!') char = 'exclamation';
            else if (char == ".") char = "dot";
            this.printCharacter(char);
        }
    }

    // Moves the cursor to the start of the next line
    nextLine() {
        for (let i = this.textPos.x + 1; i < this.textPos.x + 2; i++) {
            for (let j = this.textPos.y; j < this.textPos.y + 5; j++)
                this.setPixel(i, j, false);
        }
        this.textPos.x = 0;
        this.textPos.y += 7;
    }
}

module.exports = Graphics;