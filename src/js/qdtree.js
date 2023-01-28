/**
 * @param {number} height
 * @param {AABB} aabb a bounding box representing the image's dimensions
 * @returns a Quadtree of height [height]
 */
export default function createQTreeOfHeight(height, aabb) {
  function recursiveCreate(node, h) {
    if (h === 0) return;

    const { x, y, sideLen } = node.aabb;
    const halfSideLen = sideLen / 2;

    node.tl = new QTNode({
      x,
      y,
      sideLen: halfSideLen,
    });
    node.tr = new QTNode({
      x: x + halfSideLen,
      y,
      sideLen: halfSideLen,
    });
    node.bl = new QTNode({
      x,
      y: y + halfSideLen,
      sideLen: halfSideLen,
    });
    node.br = new QTNode({
      x: x + halfSideLen,
      y: y + halfSideLen,
      sideLen: halfSideLen,
    });

    recursiveCreate(node.tl, h - 1);
    recursiveCreate(node.tr, h - 1);
    recursiveCreate(node.bl, h - 1);
    recursiveCreate(node.br, h - 1);
  }

  const root = new QTNode(aabb);
  recursiveCreate(root, height);
  return root;
}

/**
 * @typedef {Object} AABB An axis aligned square
 * @property {number} x X coordinate of the Top-left corner of the rect.
 * @property {number} y X coordinate of the Top-left corner of the rect.
 * @property {number} sideLen length of each edge of the square.
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
      mx >= this.aabb.x + this.aabb.sideLen ||
      my >= this.aabb.y + this.aabb.sideLen
    )
      return;

    if (!this.tl) return;

    if (this.isBlurred) {
      this.isBlurred = false;
      this.tl.isBlurred =
        this.tr.isBlurred =
        this.bl.isBlurred =
        this.br.isBlurred =
          false;
      return;
    }

    this.tl.reveal(mx, my);
    this.tr.reveal(mx, my);
    this.bl.reveal(mx, my);
    this.br.reveal(mx, my);
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.isBlurred) {
      const { x, y, sideLen: w } = this.aabb;
      ctx.fillStyle = `rgb(${this.averageColor.join(", ")})`;
      const cx = x + w / 2;
      const cy = y + w / 2;
      const r = w / 2 - 0.1 * w;
      // ctx.fillRect(x, y, w, w);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
      ctx.fill();
      return;
    }

    if (!this.tl) return;
    this.tl.draw(ctx);
    this.tr.draw(ctx);
    this.bl.draw(ctx);
    this.br.draw(ctx);
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
      px >= this.aabb.x + this.aabb.sideLen ||
      py >= this.aabb.y + this.aabb.sideLen
    )
      return false;

    if (!this.tl) {
      // `this` is a leaf node
      this.nPixels ??= 0;

      const { nPixels } = this;
      const newPixelCount = nPixels + 1;
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
