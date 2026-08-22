/**
 * dataPipelines.ts — Data Pipelines para My-Excalidraw
 * Convierte datos CSV/TSV en gráficos vectoriales: Gráficos de Barras, Líneas y Tarjetas de KPIs.
 */

export interface ParsedDataSet {
  headers: string[];
  rows: (string | number)[][];
  numericSeries: { label: string; values: number[] }[];
}

/**
 * Parsea una cadena de texto en formato CSV o TSV
 */
export const parseCSVData = (csvContent: string): ParsedDataSet => {
  const lines = csvContent.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], numericSeries: [] };

  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""));

  const rows: (string | number)[][] = [];
  const numericSeries: { label: string; values: number[] }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => {
      const clean = c.trim().replace(/^["']|["']$/g, "");
      const num = parseFloat(clean.replace(/,/g, "."));
      return !isNaN(num) ? num : clean;
    });
    rows.push(cells);
  }

  // Extraer columnas numéricas
  headers.forEach((h, colIdx) => {
    const isNumCol = rows.some((r) => typeof r[colIdx] === "number");
    if (isNumCol && rows.length > 0) {
      const values = rows.map((r) => {
        const val = r[colIdx];
        return typeof val === "number" ? val : parseFloat(String(val)) || 0;
      });
      numericSeries.push({ label: h, values });
    }
  });

  return { headers, rows, numericSeries };
};

/**
 * 1. Genera un Gráfico de Barras Vectorial en el lienzo
 */
export const renderBarChart = (
  dataSet: ParsedDataSet,
  startX = 150,
  startY = 150,
): any[] => {
  const elements: any[] = [];
  const { rows, numericSeries } = dataSet;
  if (rows.length === 0 || numericSeries.length === 0) return elements;

  const labels = rows.map((r) => String(r[0] || ""));
  const series = numericSeries[0];
  const maxVal = Math.max(...series.values, 1);

  const chartWidth = Math.max(420, labels.length * 60 + 80);
  const chartHeight = 250;
  const barWidth = Math.min(48, Math.max(20, Math.floor((chartWidth - 80) / labels.length - 12)));

  const baseTime = Date.now();

  // Marco exterior del gráfico
  elements.push({
    id: `chart_bg_${baseTime}`,
    type: "rectangle",
    x: startX,
    y: startY,
    width: chartWidth,
    height: chartHeight + 70,
    strokeColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    fillStyle: "solid",
    strokeWidth: 1.5,
    roundness: { type: 3 },
    roughness: 0,
    updated: baseTime,
  });

  // Título del Gráfico
  elements.push({
    id: `chart_title_${baseTime}`,
    type: "text",
    x: startX + 16,
    y: startY + 14,
    width: chartWidth - 32,
    height: 24,
    text: `📊 Gráfico de Barras: ${series.label}`,
    fontSize: 15,
    fontFamily: 1,
    strokeColor: "#ef4444",
    textAlign: "left",
    updated: baseTime,
  });

  // Dibujar barras vectoriales
  labels.forEach((label, idx) => {
    const val = series.values[idx] || 0;
    const barHeight = Math.max(6, Math.floor((val / maxVal) * (chartHeight - 60)));
    const bx = startX + 45 + idx * (barWidth + 14);
    const by = startY + chartHeight + 15 - barHeight;

    // Barra
    elements.push({
      id: `bar_${idx}_${baseTime}`,
      type: "rectangle",
      x: bx,
      y: by,
      width: barWidth,
      height: barHeight,
      strokeColor: "#ef4444",
      backgroundColor: "#fee2e2",
      fillStyle: "solid",
      strokeWidth: 1.5,
      roundness: { type: 3 },
      roughness: 0,
      updated: baseTime,
    });

    // Valor numérico arriba de la barra
    elements.push({
      id: `bar_val_${idx}_${baseTime}`,
      type: "text",
      x: bx - 10,
      y: by - 16,
      width: barWidth + 20,
      height: 14,
      text: String(val),
      fontSize: 10,
      fontFamily: 1,
      strokeColor: "#991b1b",
      textAlign: "center",
      updated: baseTime,
    });

    // Etiqueta del eje X
    elements.push({
      id: `bar_label_${idx}_${baseTime}`,
      type: "text",
      x: bx - 15,
      y: startY + chartHeight + 22,
      width: barWidth + 30,
      height: 18,
      text: label.length > 8 ? label.substring(0, 7) + ".." : label,
      fontSize: 11,
      fontFamily: 1,
      strokeColor: "#64748b",
      textAlign: "center",
      updated: baseTime,
    });
  });

  return elements;
};

/**
 * 2. Genera un Gráfico de Líneas / Tendencia Temporal en el lienzo
 */
export const renderLineChart = (
  dataSet: ParsedDataSet,
  startX = 150,
  startY = 150,
): any[] => {
  const elements: any[] = [];
  const { rows, numericSeries } = dataSet;
  if (rows.length === 0 || numericSeries.length === 0) return elements;

  const labels = rows.map((r) => String(r[0] || ""));
  const series = numericSeries[0];
  const maxVal = Math.max(...series.values, 1);
  const minVal = Math.min(...series.values, 0);
  const range = maxVal - minVal || 1;

  const chartWidth = Math.max(440, labels.length * 65 + 80);
  const chartHeight = 250;
  const baseTime = Date.now();

  // Marco exterior
  elements.push({
    id: `linechart_bg_${baseTime}`,
    type: "rectangle",
    x: startX,
    y: startY,
    width: chartWidth,
    height: chartHeight + 70,
    strokeColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    fillStyle: "solid",
    strokeWidth: 1.5,
    roundness: { type: 3 },
    roughness: 0,
    updated: baseTime,
  });

  // Título
  elements.push({
    id: `linechart_title_${baseTime}`,
    type: "text",
    x: startX + 16,
    y: startY + 14,
    width: chartWidth - 32,
    height: 24,
    text: `📈 Tendencia Temporal: ${series.label}`,
    fontSize: 15,
    fontFamily: 1,
    strokeColor: "#0284c7",
    textAlign: "left",
    updated: baseTime,
  });

  // Puntos de datos y líneas de conexión
  const pointCoords: { x: number; y: number }[] = [];
  const stepX = (chartWidth - 90) / Math.max(1, labels.length - 1);

  labels.forEach((label, idx) => {
    const val = series.values[idx] || 0;
    const px = startX + 45 + idx * stepX;
    const py = startY + chartHeight - Math.floor(((val - minVal) / range) * (chartHeight - 70)) - 10;

    pointCoords.push({ x: px, y: py });

    // Nodo circular
    elements.push({
      id: `pt_${idx}_${baseTime}`,
      type: "ellipse",
      x: px - 5,
      y: py - 5,
      width: 10,
      height: 10,
      strokeColor: "#0284c7",
      backgroundColor: "#0284c7",
      fillStyle: "solid",
      strokeWidth: 2,
      updated: baseTime,
    });

    // Etiqueta eje X
    elements.push({
      id: `pt_lbl_${idx}_${baseTime}`,
      type: "text",
      x: px - 25,
      y: startY + chartHeight + 20,
      width: 50,
      height: 18,
      text: label.length > 7 ? label.substring(0, 6) + ".." : label,
      fontSize: 11,
      fontFamily: 1,
      strokeColor: "#64748b",
      textAlign: "center",
      updated: baseTime,
    });
  });

  // Segmentos de línea conectores
  for (let i = 0; i < pointCoords.length - 1; i++) {
    const p1 = pointCoords[i];
    const p2 = pointCoords[i + 1];
    elements.push({
      type: "line",
      id: `line_seg_${i}_${baseTime}`,
      x: p1.x,
      y: p1.y,
      width: Math.abs(p2.x - p1.x),
      height: Math.abs(p2.y - p1.y),
      points: [
        [0, 0],
        [p2.x - p1.x, p2.y - p1.y],
      ],
      strokeColor: "#0284c7",
      strokeWidth: 2.5,
      strokeStyle: "solid",
      roughness: 0,
      updated: baseTime,
    });
  }

  return elements;
};

/**
 * 3. Genera Tarjetas de KPIs numéricos resumen
 */
export const renderKPIWidget = (
  title: string,
  value: string | number,
  subtitle = "",
  startX = 150,
  startY = 150,
): any[] => {
  const elements: any[] = [];
  const baseTime = Date.now();
  const w = 220;
  const h = 110;

  elements.push({
    id: `kpi_card_${baseTime}`,
    type: "rectangle",
    x: startX,
    y: startY,
    width: w,
    height: h,
    strokeColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    fillStyle: "solid",
    strokeWidth: 1.5,
    roundness: { type: 3 },
    roughness: 0,
    updated: baseTime,
  });

  elements.push({
    id: `kpi_title_${baseTime}`,
    type: "text",
    x: startX + 14,
    y: startY + 12,
    width: w - 28,
    height: 18,
    text: title,
    fontSize: 12,
    fontFamily: 1,
    strokeColor: "#64748b",
    textAlign: "left",
    updated: baseTime,
  });

  elements.push({
    id: `kpi_val_${baseTime}`,
    type: "text",
    x: startX + 14,
    y: startY + 36,
    width: w - 28,
    height: 36,
    text: String(value),
    fontSize: 24,
    fontFamily: 1,
    strokeColor: "#ef4444",
    textAlign: "left",
    updated: baseTime,
  });

  if (subtitle) {
    elements.push({
      id: `kpi_sub_${baseTime}`,
      type: "text",
      x: startX + 14,
      y: startY + 76,
      width: w - 28,
      height: 16,
      text: subtitle,
      fontSize: 11,
      fontFamily: 1,
      strokeColor: "#16a34a",
      textAlign: "left",
      updated: baseTime,
    });
  }

  return elements;
};
