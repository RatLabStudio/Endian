import { font } from "./font.js";

export class Graphics {
  constructor(resolutionX, resolutionY) {
    this.pixels = [];

    this.backgroundColor = "blue";
    this.fontColor = "white";

    this.resolutionX = resolutionX;
    this.resolutionY = resolutionY;

    for (let row = 0; row < resolutionY; row++) {
      this.pixels.push([]);
      for (let col = 0; col < resolutionX; col++) this.pixels[row][col] = this.backgroundColor;
    }

    this.textPos = {
      // FOR TEXT DEBUGGING
      x: 0,
      y: 0,
    };

    this.lastUpdate = [];
    this.currentRow = 0;
  }

  checkForChangedRows() {
    if (this.lastUpdate.length <= 0) return false;
    for (let i = 0; i < this.pixels.length; i++) {
      for (let j = 0; j < this.pixels[i].length; j++) {
        if (this.lastUpdate[i][j] !== this.pixels[i][j]) return i;
      }
    }
    return false;
  }

  nextRow() {
    this.currentRow++;
    if (this.currentRow >= this.resolutionY) this.currentRow = 0;
  }

  getNextRowData() {
    let changedRow = this.checkForChangedRows();
    if (changedRow !== false) this.currentRow = changedRow;

    let data = {
      row: this.currentRow,
      pixels: this.pixels[this.currentRow],
    };

    this.nextRow();

    // Copy the pixel array to the lastUpdate array for storage
    this.lastUpdate = this.pixels.map(function (arr) {
      return arr.slice();
    });

    return data;
  }

  clear() {
    for (let row = 0; row < this.resolutionY; row++) {
      this.pixels.push([]);
      for (let col = 0; col < this.resolutionX; col++) this.pixels[row][col] = this.backgroundColor;
    }
  }

  setPixel(x, y, active) {
    this.pixels[y][x] = active;
    if (this.currentRow > y)
      // Move the current row to the changed pixel
      this.currentRow = y;
  }

  // Prints a character to the screen
  printCharacter(char) {
    if (char == " ") char = "space";
    else if (char == ":") char = "colon";
    else if (char == "!") char = "exclamation";
    else if (char == ".") char = "dot";

    // Clearing the area for the next character:
    /*for (let i = this.textPos.x + 1; i < this.textPos.x + 2; i++) {
      for (let j = this.textPos.y; j < this.textPos.y + 5; j++) this.setPixel(i, j, this.backgroundColor);
    }*/

    char = font[char.toLowerCase()];
    if (!char) return;

    for (let i = 0; i < char.length; i++) {
      for (let j = 0; j < char[i].length; j++) {
        if (char[i][j] === 1) this.setPixel(j + this.textPos.x, i + this.textPos.y, this.fontColor);
      }
    }

    this.textPos.x += char[0].length + 1;

    if (this.textPos.x >= this.resolutionX - 12) this.nextLine();

    // Drawing the Caret:
    /*for (let i = this.textPos.x + 1; i < this.textPos.x + 2; i++) {
      for (let j = this.textPos.y; j < this.textPos.y + 5; j++) this.setPixel(i, j, true);
    }*/

    // CLEAR SCREEN WHEN ITS FULL:
    if (this.textPos.y >= this.resolutionY) {
      this.clear();
      this.textPos.x = 9;
      this.textPos.y = 7;
    }
  }

  // Prints a string of characters to the screen
  printString(str) {
    str = str.toLowerCase();
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      if (char == " ") char = "space";
      else if (char == ":") char = "colon";
      else if (char == "!") char = "exclamation";
      else if (char == ".") char = "dot";
      this.printCharacter(char);
    }
  }

  // Moves the cursor to the start of the next line
  nextLine() {
    // Caret erase:
    /*for (let i = this.textPos.x + 1; i < this.textPos.x + 2; i++) {
      for (let j = this.textPos.y; j < this.textPos.y + 5; j++) this.setPixel(i, j, this.backgroundColor);
    }*/

    this.textPos.x = 9;
    this.textPos.y += 7;
  }
}
