const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "../examples/discovery-web-project-v2.excalidraw");

const rawData = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(rawData);

const elements = data.elements;

// 1. Map frames and their child elements
const frames = elements.filter((e) => e.type === "frame" && !e.isDeleted);
const elementsByFrame = {};

frames.forEach((f) => {
  elementsByFrame[f.id] = elements.filter((e) => e.frameId === f.id && !e.isDeleted);
});

// Helper for bounding box
function getBounds(els) {
  if (els.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, height: 300 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  els.forEach((e) => {
    const x = e.x;
    const y = e.y;
    const w = e.width || 0;
    const h = e.height || 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  });
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// 2. Enhance Text sizes & Centering inside rectangles/containers
elements.forEach((el) => {
  if (el.isDeleted) return;

  // Scale up font sizes for readability
  if (el.type === "text") {
    if (el.fontSize < 18) {
      el.fontSize = 18;
      el.height = Math.max(el.height, 26);
    } else if (el.fontSize >= 18 && el.fontSize <= 24) {
      el.fontSize = 24;
      el.height = Math.max(el.height, 34);
    } else if (el.fontSize > 24 && el.fontSize < 40) {
      el.fontSize = 32;
      el.height = Math.max(el.height, 46);
    }
  }

  // Ensure containers (rectangles / ellipses) have clean styling
  if (el.type === "rectangle" || el.type === "ellipse") {
    el.strokeWidth = 2;
    if (!el.backgroundColor || el.backgroundColor === "transparent") {
      el.backgroundColor = "#ffffff";
      el.fillStyle = "solid";
    }
  }
});

// 3. Process each frame to center elements and enlarge frame boundaries
frames.forEach((frame) => {
  const children = elementsByFrame[frame.id] || [];
  if (children.length === 0) return;

  // Calculate relative bounds of children to current frame position
  const bounds = getBounds(children);

  // Enlarge frame dimensions with generous 80px padding
  const PADDING = 80;
  const newWidth = Math.max(bounds.width + PADDING * 2, 1200);
  const newHeight = Math.max(bounds.height + PADDING * 2, 700);

  frame.width = Math.round(newWidth);
  frame.height = Math.round(newHeight);

  // Center texts that match container IDs or overlap with boxes
  const rectangles = children.filter((c) => c.type === "rectangle" || c.type === "ellipse");
  const texts = children.filter((c) => c.type === "text");

  rectangles.forEach((rect) => {
    // Find text inside or assigned to this rect
    const matchingText = texts.find(
      (t) =>
        t.containerId === rect.id ||
        (t.x >= rect.x - 20 &&
          t.x + t.width <= rect.x + rect.width + 20 &&
          t.y >= rect.y - 20 &&
          t.y + t.height <= rect.y + rect.height + 20),
    );

    if (matchingText) {
      matchingText.containerId = rect.id;
      matchingText.textAlign = "center";
      matchingText.verticalAlign = "middle";
      // Geometrically center text inside box
      matchingText.x = Math.round(rect.x + (rect.width - matchingText.width) / 2);
      matchingText.y = Math.round(rect.y + (rect.height - matchingText.height) / 2);

      if (!rect.boundElements) rect.boundElements = [];
      if (!rect.boundElements.some((b) => b.id === matchingText.id)) {
        rect.boundElements.push({ id: matchingText.id, type: "text" });
      }
    }
  });

  // Bind & Connect Arrows to nearest Boxes
  const arrows = children.filter((c) => c.type === "arrow" || c.type === "line");
  arrows.forEach((arrow) => {
    const startX = arrow.x;
    const startY = arrow.y;
    const lastPoint = arrow.points ? arrow.points[arrow.points.length - 1] : [100, 0];
    const endX = arrow.x + lastPoint[0];
    const endY = arrow.y + lastPoint[1];

    // Find closest source rect
    let sourceRect = null;
    let minDistStart = Infinity;
    rectangles.forEach((rect) => {
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      const dist = Math.hypot(cx - startX, cy - startY);
      if (dist < minDistStart && dist < 350) {
        minDistStart = dist;
        sourceRect = rect;
      }
    });

    // Find closest target rect
    let targetRect = null;
    let minDistEnd = Infinity;
    rectangles.forEach((rect) => {
      if (rect === sourceRect) return;
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      const dist = Math.hypot(cx - endX, cy - endY);
      if (dist < minDistEnd && dist < 350) {
        minDistEnd = dist;
        targetRect = rect;
      }
    });

    if (sourceRect) {
      arrow.startBinding = {
        elementId: sourceRect.id,
        focus: 0,
        gap: 8,
      };
      if (!sourceRect.boundElements) sourceRect.boundElements = [];
      if (!sourceRect.boundElements.some((b) => b.id === arrow.id)) {
        sourceRect.boundElements.push({ id: arrow.id, type: "arrow" });
      }
    }

    if (targetRect) {
      arrow.endBinding = {
        elementId: targetRect.id,
        focus: 0,
        gap: 8,
      };
      if (!targetRect.boundElements) targetRect.boundElements = [];
      if (!targetRect.boundElements.some((b) => b.id === arrow.id)) {
        targetRect.boundElements.push({ id: arrow.id, type: "arrow" });
      }
    }
  });
});

// 4. Arrange all 12 Frames in a clean 2-Column Layout Grid
const COLUMNS = 2;
const GAP_X = 150;
const GAP_Y = 120;
const START_X = 0;
const START_Y = 0;

let currentCol = 0;
let currentRowY = START_Y;
let maxColWidths = [0, 0];
let rowMaxHeight = 0;

// First pass: compute column widths
frames.forEach((frame, idx) => {
  const col = idx % COLUMNS;
  if (frame.width > maxColWidths[col]) {
    maxColWidths[col] = frame.width;
  }
});

let xPos = [START_X, START_X + maxColWidths[0] + GAP_X];
let yPos = [START_Y, START_Y];

frames.forEach((frame, idx) => {
  const col = idx % COLUMNS;

  const dx = xPos[col] - frame.x;
  const dy = yPos[col] - frame.y;

  // Move frame
  frame.x = xPos[col];
  frame.y = yPos[col];

  // Move all children accordingly
  const children = elementsByFrame[frame.id] || [];
  children.forEach((child) => {
    child.x += dx;
    child.y += dy;
  });

  // Track max height for the row
  if (frame.height > rowMaxHeight) {
    rowMaxHeight = frame.height;
  }

  // Advance to next row after 2 columns
  if (col === 1) {
    yPos[0] += rowMaxHeight + GAP_Y;
    yPos[1] += rowMaxHeight + GAP_Y;
    rowMaxHeight = 0;
  }
});

// Save transformed file
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
console.log("Formateo y optimizacion completada con exito en discovery-web-project-v2.excalidraw");
