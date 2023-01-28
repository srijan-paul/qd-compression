import createQTreeOfHeight from "./qdtree.js";

const img = document.getElementById("debanwita");

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvas.width = img.width;
canvas.height = img.height;

ctx.drawImage(img, 0, 0, img.width, img.height);

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

ctx.clearRect(0, 0, canvas.width, canvas.height);

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
 * Return the number of levels in a Quadtree that represents a compressed image of the given resolution
 * @param {number} nPixels number of pixels across the width and height of an NxN image.
 */
function calculateQTreeHeight(nPixels) {
  return Math.floor(Math.log2(nPixels));
}

/**
 * @param {ImageData} image image data to construct the quadtree from. Must be 4n x 4n pixels.
 */
function constructQTree(image) {
  const { width, height } = image;

  if (width !== height) {
    throw new Error("Image must have equal width and height");
  }

  const N = width;
  const treeHeight = calculateQTreeHeight(N);
  const qTree = createQTreeOfHeight(treeHeight, { x: 0, y: 0, sideLen: N });
  return qTree;
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

const qTree = constructQTree(imageData);
populate(qTree, imageData);
ctx.clearRect(0, 0, ctx.width, ctx.height);
qTree.draw(ctx);

const mousePos = { x: 0, y: 0 };

let lastUpdateTime = -Infinity;
const frameTime = 0;

function update() {
  const currentTime = Date.now();

  const diff = currentTime - lastUpdateTime;
  if (diff < frameTime) {
    return;
  }

  lastUpdateTime = currentTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  qTree.reveal(mousePos.x, mousePos.y);
  qTree.draw(ctx);
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  mousePos.x = x;
  mousePos.y = y;

  update();
});

// console.log(qTree.averageColor.join(", "));
