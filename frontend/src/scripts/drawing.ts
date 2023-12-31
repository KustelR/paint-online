export type Position = {
  x: number;
  y: number;
};

export function distance(pos1: Position, pos2: Position): number {
  const xlen = Math.abs(Math.abs(pos1.x) - Math.abs(pos2.x)); 
  const ylen = Math.abs(Math.abs(pos1.y) - Math.abs(pos2.y)); 
  return Math.sqrt(xlen * xlen + ylen * ylen);
}

export interface Color {
  toRGB(): { r: number; g: number; b: number };
  toRGBA(): { r: number; g: number; b: number; a: number };
  toHexString(): string;
}

export class RGBAColor implements Color {
  constructor(red: number, green: number, blue: number, alpha: number) {
    this.R = red;
    this.G = green;
    this.B = blue;
    this.A = alpha;
  }
  R: number = 255;
  G: number = 255;
  B: number = 255;
  A: number = 255;

  toRGB(): { r: number; g: number; b: number } {
    return { r: this.R, g: this.G, b: this.B };
  }
  toRGBA(): { r: number; g: number; b: number; a: number } {
    return { r: this.R, g: this.G, b: this.B, a: this.A };
  }

  toHexString(): string {
    return `#${
      this.R.toString(16).length > 1
        ? this.R.toString(16)
        : "0" + this.R.toString(16)
      }${
      this.G.toString(16).length > 1
        ? this.G.toString(16)
        : "0" + this.G.toString(16)
    }${
      this.B.toString(16).length > 1
        ? this.B.toString(16)
        : "0" + this.B.toString(16)
    }`;
  }
}

export function ColorFromHex(hex: string): Color {
  const red = Number("0x" + hex.slice(1, 3));
  const green = Number("0x" + hex.slice(3, 5));
  const blue = Number("0x" + hex.slice(5, 7));
  const alpha = 255;
  return new RGBAColor(red, green, blue, alpha);
}

export function draw(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  const rect = canvas.getBoundingClientRect();
  drawFigure(x, y, new RGBAColor(0, 0, 0, 255), canvas, ctx);
}

export function drawFigure(
  x: number,
  y: number,
  color: Color,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  let index = x + y * canvas.width;
  let canvasData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
  if (!canvasData) {
    throw new Error("No canvas data found");
  }
  drawBox(canvasData, index, color, 5);
  index++;

  ctx?.putImageData(canvasData, 0, 0);
}

export function drawPixel(
  imageData: ImageData,
  index: number,
  color: Color
): ImageData {
  const { r, g, b, a } = color.toRGBA();
  imageData.data[index * 4 + 0] = r;
  imageData.data[index * 4 + 1] = g;
  imageData.data[index * 4 + 2] = b;
  imageData.data[index * 4 + 3] = a;
  return imageData;
}

export function drawHorizontalLine(
  imageData: ImageData,
  index: number,
  color: Color,
  length: number,
  centered: boolean = false
): ImageData {
  for (let i = 0; i < length; i++) {
    imageData = drawPixel(imageData, index + i, color);
  }

  return imageData;
}

export function drawBox(
  imageData: ImageData,
  index: number,
  color: Color,
  size: number
): ImageData {
  imageData = drawHorizontalLine(imageData, index, color, size);
  for (let i = 1; i < size / 2; i++) {
    imageData = drawHorizontalLine(
      imageData,
      index + imageData.width * i,
      color,
      size
    );
    imageData = drawHorizontalLine(
      imageData,
      index + imageData.width * -i,
      color,
      size
    );
  }

  return imageData;
}
