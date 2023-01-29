/**
 * @fileoverview Utility functions useful for manipulating SVG elements.
 */

/**
 * @param {SVGElement} root The root <svg> container
 * @param {number} cx x coordinate of the center of the circle
 * @param {number} cy y coordinate of the center of the circle
 * @param {number} r radius of the circle
 * @returns A DOM node representing the circle
 */
function createSVGCircle(root, cx, cy, r, color) {
  const domNode = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );

  domNode.r = r;
  domNode.cx = cx;
  domNode.cy = cy;

  domNode.setAttribute("fill", color);
  domNode.setAttribute("fill-opacity", 1);

  root.appendChild(domNode);

  return domNode;
}
