/**
 * @param {number} height
 * @param {AABB} aabb a bounding box representing the image's dimensions
 * @returns a Quadtree of height [height]
 */
export default function createQTreeOfHeight(height, aabb) {
  function recursiveCreate(node, height) {
    if (height === 0) return;

    const { x, y, w, h } = node.aabb;
    const halfW = w / 2;
    const halfH = h / 2;

    node.tl = new QTNode({
      x,
      y,
      w: halfW,
      h: halfH,
    });
    node.tr = new QTNode({
      x: x + halfW,
      y,
      w: halfW,
      h: halfH,
    });
    node.bl = new QTNode({
      x,
      y: y + halfH,
      w: halfW,
      h: halfH,
    });
    node.br = new QTNode({
      x: x + halfW,
      y: y + halfH,
      w: halfW,
      h: halfH,
    });

    recursiveCreate(node.tl, height - 1);
    recursiveCreate(node.tr, height - 1);
    recursiveCreate(node.bl, height - 1);
    recursiveCreate(node.br, height - 1);
  }

  const root = new QTNode(aabb);
  root.height = height;
  recursiveCreate(root, height);
  return root;
}

/**
 * Get the RGB value of a pixel at a given coordinate.
 * @param {number} x The X-coordinate of the pixel value to fetch
 * @param {number} y The Y-coordiante of the pixel value to fetch
 * @param {Uint8ClampedArray} imageData
 * @param {number} width Width of the image data
 * @returns {number[]} An array of three numbers representing the RGB value of the pixel at (x, y)
 */
function getRGBValuesFromCoord(x, y, imageData, width) {
  const index = (x + y * width) * 4;
  return new Uint8Array([
    imageData[index],
    imageData[index + 1],
    imageData[index + 2],
  ]);
}

/**
 * @param {QTNode} qTree
 * @param {ImageData} image
 */
function populate(qTree, image) {
  const { width, height, data } = image;

  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const color = getRGBValuesFromCoord(x, y, data, width);
      qTree.insert(x, y, color);
    }
  }
}

/**
 *
 * @param {ImageData} imageData Data of the image to be compressed
 * @param {number} factor The compression factor (must be a positive integer).
 */
export function compressImageData(imageData, factor) {
  const { width, height } = imageData;
  const newWidth = Math.ceil(width / factor);
  const newHeight = Math.ceil(height / factor);

  const qTreeHeight = Math.floor(Math.log(newWidth * newHeight) / Math.log(4));

  const qTree = createQTreeOfHeight(qTreeHeight, {
    x: 0,
    y: 0,
    w: width,
    h: height,
  });

  populate(qTree, imageData);
  return qTree;
}

/**
 * @typedef {Object} AABB An axis aligned square
 * @property {number} x X coordinate of the Top-left corner of the rect.
 * @property {number} y X coordinate of the Top-left corner of the rect.
 * @property {number} width width of the rect.
 * @property {number} height height of the rect.
 */

export class QTNode {
  /**
   * @param {AABB} aabb The AABB bounding this quadtree node
   */
  constructor(aabb) {
    this.aabb = aabb;
    this.tl = null;
    this.tr = null;
    this.bl = null;
    this.br = null;
    this.isBlurred = true;
    this.averageColor = new Uint8Array([255, 255, 255]);
  }

  computeAverageColor() {
    const tlColor = this.tl.averageColor;
    const trColor = this.tr.averageColor;
    const blColor = this.bl.averageColor;
    const brColor = this.br.averageColor;
    this.averageColor[0] =
      (tlColor[0] + trColor[0] + blColor[0] + brColor[0]) / 4;
    this.averageColor[1] =
      (tlColor[1] + trColor[1] + blColor[1] + brColor[1]) / 4;
    this.averageColor[2] =
      (tlColor[2] + trColor[2] + blColor[2] + brColor[2]) / 4;
  }

  reveal(mx, my) {
    if (
      mx <= this.aabb.x ||
      my <= this.aabb.y ||
      mx >= this.aabb.x + this.aabb.w ||
      my >= this.aabb.y + this.aabb.h
    )
      return;

    if (!this.tl) return;

    if (this.isBlurred) {
      this.isBlurred = false;
      return;
    }

    this.tl.reveal(mx, my);
    this.tr.reveal(mx, my);
    this.bl.reveal(mx, my);
    this.br.reveal(mx, my);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} height
   */
  draw(ctx, height) {
    if (this.isBlurred) {
      const { x, y, w, h } = this.aabb;
      ctx.fillStyle = `rgb(${this.averageColor.join(", ")})`;
      ctx.fillRect(x, y, w, h);
      return;
    }

    if (!this.tl) return;

    this.tl.draw(ctx, height - 1);
    this.tr.draw(ctx, height - 1);
    this.bl.draw(ctx, height - 1);
    this.br.draw(ctx, height - 1);
  }

  drawAtHeight(ctx, height) {
    if (height === 0) {
      const { x, y, w, h } = this.aabb;
      ctx.fillStyle = `rgb(${this.averageColor.join(", ")})`;
      ctx.fillRect(x, y, w, h);
      return;
    }

    if (!this.tl) return;
    this.tl.drawAtHeight(ctx, height - 1);
    this.tr.drawAtHeight(ctx, height - 1);
    this.bl.drawAtHeight(ctx, height - 1);
    this.br.drawAtHeight(ctx, height - 1);
  }

  /**
   * @param {number} px X coordinate of the pixel
   * @param {number} py Y coordinate of the pixel
   * @param {[number, number, number]} colors Insert the colors into this QTNode.
   * @returns {boolean} true if insertion was successful, `false` if the [x, y] coordinates are out of bounds
   */
  insert(px, py, colors) {
    const [r, g, b] = colors;

    if (
      px <= this.aabb.x ||
      py <= this.aabb.y ||
      px >= this.aabb.x + this.aabb.w ||
      py >= this.aabb.y + this.aabb.h
    )
      return false;

    if (!this.tl) {
      // `this` is a leaf node
      if (!this.nPixels) {
        this.nPixels = 0;
        this.averageColor = new Uint8Array([r, g, b]);
        return true;
      }

      const newPixelCount = this.nPixels + 1;
      const { nPixels } = this;
      this.averageColor[0] = this.averageColor[0] * nPixels + r / newPixelCount;
      this.averageColor[1] = this.averageColor[1] * nPixels + g / newPixelCount;
      this.averageColor[2] = this.averageColor[2] * nPixels + b / newPixelCount;

      this.nPixels = newPixelCount;
      return true;
    }

    const insertSuccess =
      this.tl.insert(px, py, colors) ||
      this.tr.insert(px, py, colors) ||
      this.bl.insert(px, py, colors) ||
      this.br.insert(px, py, colors);

    this.computeAverageColor();

    return insertSuccess;
  }
}
