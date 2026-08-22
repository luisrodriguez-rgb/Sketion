/**
 * sheetsImporter.ts — Google Sheets / CSV Importer Utility for My-Excalidraw
 * Parsea datos TSV/CSV y genera tablas vectoriales proporcionales con ancho dinámico de columnas.
 */

export interface SheetTableResult {
  elements: any[];
  width: number;
  height: number;
}

export const parseSheetDataToExcalidraw = (
  rawText: string,
  startX = 100,
  startY = 100,
): SheetTableResult => {
  const lines = rawText.trim().split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return { elements: [], width: 0, height: 0 };

  // Detección automática del delimitador (Tabulación para Sheets/Excel, coma o punto y coma para CSV)
  const firstLine = lines[0];
  let delimiter = "\t";
  if (firstLine.includes("\t")) {
    delimiter = "\t";
  } else if (firstLine.includes(";")) {
    delimiter = ";";
  } else if (firstLine.includes(",")) {
    delimiter = ",";
  }

  const grid: string[][] = lines.map((line) =>
    line.split(delimiter).map((cell) => cell.trim().replace(/^["']|["']$/g, "")),
  );

  const numRows = grid.length;
  const numCols = Math.max(...grid.map((row) => row.length));

  // 1. Calcular ancho dinámico por columna según la longitud del texto
  const colWidths: number[] = [];
  for (let c = 0; c < numCols; c++) {
    let maxCharLen = 6;
    for (let r = 0; r < numRows; r++) {
      const textLen = (grid[r][c] || "").length;
      if (textLen > maxCharLen) maxCharLen = textLen;
    }
    // Ancho proporcional: mínimo 120px, máximo 340px
    const estimatedWidth = Math.min(340, Math.max(120, maxCharLen * 9 + 30));
    colWidths.push(estimatedWidth);
  }

  // Pre-calcular posiciones X de cada columna
  const colXPositions: number[] = [startX];
  for (let c = 0; c < numCols - 1; c++) {
    colXPositions.push(colXPositions[c] + colWidths[c]);
  }

  const CELL_HEIGHT = 44;
  const elements: any[] = [];
  const baseTime = Date.now();
  const groupId = `sheet_group_${baseTime}`;

  for (let r = 0; r < numRows; r++) {
    const isHeader = r === 0;
    for (let c = 0; c < numCols; c++) {
      const cellText = grid[r][c] || "";
      const cellWidth = colWidths[c];
      const cellX = colXPositions[c];
      const cellY = startY + r * CELL_HEIGHT;
      const rectId = `sheet_rect_${baseTime}_${r}_${c}`;
      const textId = `sheet_text_${baseTime}_${r}_${c}`;

      const rectElement = {
        id: rectId,
        type: "rectangle",
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: CELL_HEIGHT,
        strokeColor: isHeader ? "#ef4444" : "#cbd5e1",
        backgroundColor: isHeader ? "#fef2f2" : r % 2 === 1 ? "#f8fafc" : "#ffffff",
        fillStyle: "solid",
        strokeWidth: isHeader ? 2 : 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [groupId],
        frameId: null,
        roundness: { type: 3 },
        isDeleted: false,
        boundElements: [{ id: textId, type: "text" }],
        updated: baseTime,
        link: null,
        locked: false,
      };

      const textElement = {
        id: textId,
        type: "text",
        x: cellX + 10,
        y: cellY + (CELL_HEIGHT - 20) / 2,
        width: cellWidth - 20,
        height: 20,
        angle: 0,
        strokeColor: isHeader ? "#991b1b" : "#1e293b",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [groupId],
        frameId: null,
        roundness: null,
        isDeleted: false,
        boundElements: [],
        updated: baseTime,
        link: null,
        locked: false,
        fontSize: isHeader ? 14 : 12.5,
        fontFamily: 1,
        text: cellText,
        originalText: cellText,
        textAlign: isHeader ? "center" : "left",
        verticalAlign: "middle",
        containerId: rectId,
        lineHeight: 1.2,
      };

      elements.push(rectElement, textElement);
    }
  }

  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const totalHeight = numRows * CELL_HEIGHT;

  return {
    elements,
    width: totalWidth,
    height: totalHeight,
  };
};
