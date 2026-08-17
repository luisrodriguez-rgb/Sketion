/**
 * helpers.ts — Utilidades de generación de elementos vectoriales de Excalidraw
 * con paleta de colores y proporciones alineadas a Sketion Branding System.
 */

export const SKETION_COLORS = {
  blue: "#0284c7",
  blueBg: "#e0f2fe",
  indigo: "#6366f1",
  indigoBg: "#e0e7ff",
  emerald: "#10b981",
  emeraldBg: "#d1fae5",
  amber: "#f59e0b",
  amberBg: "#fef3c7",
  rose: "#f43f5e",
  roseBg: "#ffe4e6",
  violet: "#8b5cf6",
  violetBg: "#ede9fe",
  slate: "#334155",
  slateLight: "#94a3b8",
  slateBg: "#f8fafc",
  borderLight: "#cbd5e1",
  white: "#ffffff",
  darkStroke: "#1e293b",
};

export const createBaseElement = (
  type: string,
  x: number,
  y: number,
  width: number,
  height: number,
  custom: Record<string, any> = {},
) => {
  return {
    id: `${type}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
    type,
    x,
    y,
    width,
    height,
    strokeColor: SKETION_COLORS.darkStroke,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    updated: Date.now(),
    link: null,
    locked: false,
    ...custom,
  };
};

export const createRectangle = (
  x: number,
  y: number,
  width: number,
  height: number,
  custom: Record<string, any> = {},
) => {
  return createBaseElement("rectangle", x, y, width, height, custom);
};

export const createText = (
  x: number,
  y: number,
  text: string,
  fontSize = 16,
  custom: Record<string, any> = {},
) => {
  return createBaseElement("text", x, y, 200, 30, {
    text,
    fontSize,
    fontFamily: 1,
    strokeColor: SKETION_COLORS.darkStroke,
    textAlign: "center",
    verticalAlign: "middle",
    ...custom,
  });
};

export const createArrow = (
  x: number,
  y: number,
  points: [number, number][],
  custom: Record<string, any> = {},
) => {
  return createBaseElement("arrow", x, y, 100, 100, {
    points,
    strokeColor: SKETION_COLORS.blue,
    strokeWidth: 2,
    ...custom,
  });
};

export const createEllipse = (
  x: number,
  y: number,
  width: number,
  height: number,
  custom: Record<string, any> = {},
) => {
  return createBaseElement("ellipse", x, y, width, height, custom);
};

export const createDiamond = (
  x: number,
  y: number,
  width: number,
  height: number,
  custom: Record<string, any> = {},
) => {
  return createBaseElement("diamond", x, y, width, height, custom);
};

export const createCard = (
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  headerBg = SKETION_COLORS.blueBg,
  headerColor = SKETION_COLORS.blue,
  cardBg = "#ffffff",
) => {
  const elements: any[] = [];
  const headerHeight = 38;

  // Header
  elements.push(
    createRectangle(x, y, width, headerHeight, {
      backgroundColor: headerBg,
      strokeColor: headerColor,
      strokeWidth: 1.5,
      roundness: { type: 3 },
    }),
  );

  elements.push(
    createText(x + 10, y + 8, title, 14, {
      width: width - 20,
      height: 24,
      strokeColor: headerColor,
      textAlign: "center",
    }),
  );

  // Body container
  elements.push(
    createRectangle(x, y + headerHeight + 6, width, height - headerHeight - 6, {
      backgroundColor: cardBg,
      strokeColor: SKETION_COLORS.borderLight,
      strokeWidth: 1.5,
      strokeStyle: "dashed",
      roundness: { type: 3 },
    }),
  );

  return elements;
};

export const wrapText = (text: string, maxLen = 25): string => {
  if (!text) return "";
  const words = text.split(" ");
  let currentLine = "";
  const lines: string[] = [];

  words.forEach((word) => {
    if ((currentLine + " " + word).trim().length > maxLen) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.join("\n");
};
