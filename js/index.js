import { compressImageData } from "./qdtree.js";

const img = document.getElementById("debanwita");

function readImageDataUsingCanvas(canvas, ctx, img) {
  ctx.imageSmoothingEnabled = false;
  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0, img.width, img.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return imageData;
}

function initSliderCanvas() {
  const sliderCanvas = document.querySelector("#canvas-1");
  const ctx = sliderCanvas.getContext("2d");
  
  const imageData = readImageDataUsingCanvas(sliderCanvas, ctx, img)

  const qTree = compressImageData(imageData, 1);
  const qHeight = qTree.height;
  let heightToDraw = qHeight;

  ctx.clearRect(0, 0, ctx.width, ctx.height);
  qTree.drawAtHeight(ctx, 1);

  const slider = document.getElementById("slider");
  setInterval(() => {
    const newValue = slider.value;
    const newHeightToDraw = Math.floor((newValue / 100) * qHeight);

    if (heightToDraw === newHeightToDraw) return;

    heightToDraw = newHeightToDraw;

    ctx.clearRect(0, 0, sliderCanvas.width, sliderCanvas.height);
    qTree.drawAtHeight(ctx, heightToDraw);
  }, 16.67);
}

function initMouseCanvas(image) {
  const canvas = document.getElementById("canvas-2");
  const ctx = canvas.getContext("2d");
 
  const imageData = readImageDataUsingCanvas(canvas, ctx, image)
  const qTree = compressImageData(imageData, 1);
  qTree.draw(ctx)

  const mousePos = { x: 0, y: 0 };
  let lastUpdateTime = -Infinity;
  const frameTime = 30;

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
}

img.onload = () => {
  initSliderCanvas();
};

const img2 = document.querySelector("#animegirl")
img2.onload = () => initMouseCanvas(img2)
