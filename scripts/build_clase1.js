const fs = require('fs');
const path = require('path');

let ridCount = 0;
function rid(n = 16) {
  ridCount++;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = `el_${ridCount}_`;
  for (let i = 0; i < n; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const elements = [];

const INK="#0C0C0C", BORDER="#bdbdbd", STICKY="#FFE95C", REMATE="#F5BEC0";
const PAIN="#E03A2F", PAIN_BG="#FDEFEF", CAPTURE="#F05A5A", CAPTURE_BG="#FDEFEF";
const DASH="#9A9A9A", WHITE="#ffffff", HEAD_BG="#0C0C0C";

function rect(x, y, w, h, bg, stroke, fid, angle = 0, stroke_w = 1.5, roundness = 3) {
  const rectid = rid();
  elements.push({
    type: "rectangle",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: rectid,
    fillStyle: "solid",
    strokeWidth: stroke_w,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: angle,
    x: x,
    y: y,
    strokeColor: stroke,
    backgroundColor: bg,
    width: w,
    height: h,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: fid,
    roundness: roundness ? { type: roundness } : null,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false
  });
  return rectid;
}

function ellipse(x, y, w, h, bg, stroke, fid, stroke_w = 2.5) {
  const eid = rid();
  elements.push({
    type: "ellipse",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: eid,
    fillStyle: "solid",
    strokeWidth: stroke_w,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: x,
    y: y,
    strokeColor: stroke,
    backgroundColor: bg,
    width: w,
    height: h,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: fid,
    roundness: null,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false
  });
  return eid;
}

function bind_text(cid, x, y, w, h, text, fid, font_size = 14, color = INK, align = "left", bold_family = 2) {
  const tid = rid();
  const target = elements.find(e => e.id === cid);
  if (target) {
    target.boundElements.push({ id: tid, type: "text" });
  }
  elements.push({
    type: "text",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: tid,
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: x,
    y: y,
    strokeColor: color,
    backgroundColor: "transparent",
    width: w,
    height: h,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: fid,
    roundness: null,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false,
    fontSize: font_size,
    fontFamily: bold_family,
    text: text,
    textAlign: align,
    verticalAlign: "middle",
    containerId: cid,
    originalText: text,
    lineHeight: 1.25,
    baseline: h * 0.8
  });
}

function free_text(x, y, w, h, text, fid, font_size = 15, color = INK, align = "left", bold_family = 2) {
  elements.push({
    type: "text",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: rid(),
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: x,
    y: y,
    strokeColor: color,
    backgroundColor: "transparent",
    width: w,
    height: h,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: fid,
    roundness: null,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false,
    fontSize: font_size,
    fontFamily: bold_family,
    text: text,
    textAlign: align,
    verticalAlign: "top",
    containerId: null,
    originalText: text,
    lineHeight: 1.25,
    baseline: font_size
  });
}

function card(x, y, w, h, text, fid, bg = WHITE, stroke = BORDER, font_size = 13, stroke_w = 1.5, align = "left", roundness = 3) {
  const pad = 10;
  const rid_ = rect(x, y, w, h, bg, stroke, fid, 0, stroke_w, roundness);
  bind_text(rid_, x + pad, y + pad, w - 2 * pad, h - 2 * pad, text, fid, font_size, INK, align);
  return rid_;
}

function arrow(x1, y1, x2, y2, fid, color = INK, dashed = false, stroke_w = 2) {
  const w = x2 - x1;
  const h = y2 - y1;
  elements.push({
    type: "arrow",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: rid(),
    fillStyle: "solid",
    strokeWidth: stroke_w,
    strokeStyle: dashed ? "dashed" : "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: x1,
    y: y1,
    strokeColor: dashed ? DASH : color,
    backgroundColor: "transparent",
    width: w,
    height: h,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: fid,
    roundness: { type: 2 },
    boundElements: [],
    updated: 1,
    link: null,
    locked: false,
    points: [[0, 0], [w, h]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "triangle"
  });
}

function vline(x, y1, y2, fid, color = DASH, dashed = true, stroke_w = 1.5) {
  elements.push({
    type: "line",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: rid(),
    fillStyle: "solid",
    strokeWidth: stroke_w,
    strokeStyle: dashed ? "dashed" : "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: x,
    y: y1,
    strokeColor: color,
    backgroundColor: "transparent",
    width: 0,
    height: y2 - y1,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: fid,
    roundness: { type: 2 },
    boundElements: [],
    updated: 1,
    link: null,
    locked: false,
    points: [[0, 0], [0, y2 - y1]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null
  });
}

function hline(x1, y, x2, fid, color = INK, dashed = false, stroke_w = 2) {
  elements.push({
    type: "line",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: rid(),
    fillStyle: "solid",
    strokeWidth: stroke_w,
    strokeStyle: dashed ? "dashed" : "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: x1,
    y: y,
    strokeColor: color,
    backgroundColor: "transparent",
    width: x2 - x1,
    height: 0,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: fid,
    roundness: { type: 2 },
    boundElements: [],
    updated: 1,
    link: null,
    locked: false,
    points: [[0, 0], [x2 - x1, 0]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null
  });
}

function sticky_label(x, y, text, fid, angle_deg = -2, font_size = 19) {
  const angle = (angle_deg * Math.PI) / 180;
  const w = Math.max(240, text.length * font_size * 0.6);
  const h = font_size * 2.4;
  const sid = rect(x, y, w, h, STICKY, INK, fid, angle, 1.5, 1);
  bind_text(sid, x, y, w, h, text, fid, font_size, INK, "center");
  return [w, h];
}

function chip(x, y, w, h, number_text, label_text, fid) {
  const cid = rect(x, y, w, h, HEAD_BG, HEAD_BG, fid, 0, 1.5, 2);
  bind_text(cid, x, y, w, h * 0.62, number_text, fid, 42, WHITE, "center");
  free_text(x + 10, y + h * 0.64, w - 20, h * 0.32, label_text, fid, 13, WHITE, "center");
  return cid;
}

function frame(x, y, w, h, name) {
  const fid = rid();
  elements.push({
    type: "frame",
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    id: fid,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: x,
    y: y,
    strokeColor: INK,
    backgroundColor: "transparent",
    width: w,
    height: h,
    seed: Math.floor(Math.random() * 2000000000),
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: [],
    updated: 1,
    link: null,
    locked: false,
    name: name
  });
  return fid;
}

const CURSOR = { x: 0, y: 0, row_h: 0 };
const MAX_ROW_W = 4700;
const GAP = 160;

function place(w, h) {
  if (CURSOR.x + w > MAX_ROW_W && CURSOR.x > 0) {
    CURSOR.x = 0;
    CURSOR.y += CURSOR.row_h + GAP;
    CURSOR.row_h = 0;
  }
  const x = CURSOR.x;
  const y = CURSOR.y;
  CURSOR.x += w + GAP;
  CURSOR.row_h = Math.max(CURSOR.row_h, h);
  return [x, y];
}

function label_tag(fid, fx, fy, title, motorcode, motorname) {
  sticky_label(fx + 40, fy - 32, `${title} · ${motorcode} ${motorname}`, fid);
}

// 1. BIENVENIDA -> C FLUJO
let [w, h] = [2000, 760];
let [x, y] = place(w, h);
let fid = frame(x, y, w, h, "01 Bienvenida");
label_tag(fid, x, y, "BIENVENIDA", "C", "FLUJO");
const steps = [
  ["1", "El curso", "Evaluacion, metodologia,\nuso de IAG y unidades."],
  ["2", "Que es Analitica", "Los 5 niveles: de lo\ndescriptivo a lo cognitivo."],
  ["3", "Prescriptiva en accion", "Donde aplica, que datos\nexige, que retos enfrenta."],
  ["4", "Decisiones y riesgo", "Estructurado vs no; \nincertidumbre vs riesgo."],
  ["5", "Modelos de decision", "Variables, restricciones,\nfuncion objetivo + taller."],
  ["6", "Taller de repaso", "10 ejercicios, de menor\na mayor dificultad."],
  ["7", "Cierre", "Resumen, proxima\nclase y bibliografia."]
];
const box_w = 250, box_h = 150;
const baseline = y + h * 0.5;
const amp = 110;
const x0 = x + 70;
const gapx = (w - 140 - box_w) / (steps.length - 1);
const pts = [];
steps.forEach(([num, title, desc], i) => {
  const bx = x0 + i * gapx;
  const by = baseline + (i % 2 !== 0 ? amp : -amp);
  card(bx, by, box_w, box_h, `${num}. ${title}\n${desc}`, fid, WHITE, BORDER, 13, 2);
  pts.push([bx, by]);
});
for (let i = 0; i < pts.length - 1; i++) {
  const [x1, y1] = pts[i];
  const [x2, y2] = pts[i + 1];
  arrow(x1 + box_w, y1 + box_h / 2, x2, y2 + box_h / 2, fid);
}
const [qx, qy] = [x + 70, y + 70];
card(qx, qy, box_w, 90, "Pregunta de activacion:\nQue datos genera tu negocio\ny se usan para decidir?", fid, PAIN_BG, CAPTURE, 12);
arrow(qx + box_w / 2, qy + 90, pts[0][0] + box_w / 2, pts[0][1], fid, true);

// 2. EL CURSO -> G MATRIZ
[w, h] = [2100, 1150];
[x, y] = place(w, h);
fid = frame(x, y, w, h, "02 El curso");
label_tag(fid, x, y, "EL CURSO", "G", "MATRIZ");
const headers = ["ACTIVIDAD", "RELACION RAA", "NIVEL USO IAG", "% NOTA"];
const rows = [
  ["Parcial I", "SO1, SO4", "No IAG", "25%"],
  ["Parcial II", "SO1", "No IAG", "25%"],
  ["Parcial III", "SO1", "No IAG", "25%"],
  ["Proyecto (equipo)", "SO1,SO3,SO4,SO5", "Colaboracion con IAG", "20%"],
  ["Presentacion articulo", "SO3,SO4,SO5", "Planificacion con IAG", "5%"]
];
const col_w = [420, 420, 480, 180];
const [tx, ty] = [x + 40, y + 90];
let cx = tx;
headers.forEach((htext, i) => {
  const cw = col_w[i];
  const hid = rect(cx, ty, cw, 50, HEAD_BG, HEAD_BG, fid, 0, 1.5, 0);
  bind_text(hid, cx, ty, cw, 50, htext, fid, 13, WHITE, "center");
  cx += cw;
});
let ry = ty + 50;
rows.forEach(row => {
  cx = tx;
  row.forEach((val, i) => {
    const cw = col_w[i];
    card(cx, ry, cw, 54, val, fid, WHITE, BORDER, 12, 1.5, "center", 0);
    cx += cw;
  });
  ry += 54;
});
chip(tx, ry + 40, 500, 150, "75%", "NOTA INDIVIDUAL\nsuma de 3 parciales", fid);
chip(tx + 540, ry + 40, 500, 150, "25%", "NOTA EN EQUIPO\nproyecto (20%) + articulo (5%)", fid);

const uy = ry + 220;
const units = [
  ["UNIDAD 1", "Intro al analisis de\ndecisiones (estamos aqui)"],
  ["UNIDAD 2", "Modelado PL y PE"],
  ["UNIDAD 3", "Algoritmos: Simplex,\nsensibilidad, heuristicas"]
];
let ux = tx;
units.forEach(([t, d], i) => {
  const bg = i === 0 ? STICKY : WHITE;
  card(ux, uy, 320, 110, `${t}\n${d}`, fid, bg, BORDER, 12);
  if (i < 2) arrow(ux + 320, uy + 55, ux + 340, uy + 55, fid);
  ux += 340;
});

let rx_sec2 = tx;
const res = [
  "MATERIAL\nSaman (actualizacion continua)",
  "RECURSOS\nPresentaciones por sesion",
  "DATOS\nExcel y .csv para talleres",
  "CANAL\nComunicaciones y avisos"
];
res.forEach(r => {
  card(rx_sec2, uy + 150, 270, 90, r, fid, WHITE, BORDER, 12);
  rx_sec2 += 290;
});

// 3. QUE ES ANALITICA -> I ARBOL
[w, h] = [1500, 1150];
[x, y] = place(w, h);
fid = frame(x, y, w, h, "03 Que es Analitica");
label_tag(fid, x, y, "QUE ES ANALITICA", "I", "ARBOL");
free_text(x + 40, y + 70, w - 80, 60, '"El analisis descubre e interpreta patrones en los datos para decidir mejor." - Oracle Analytics, 2021', fid, 13, "#5c5c5c");
const levels = [
  ["COGNITIVA", "Como puede el sistema razonar por si mismo?", 620],
  ["PRESCRIPTIVA", "Que deberia hacer? (foco del curso)", 760],
  ["PREDICTIVA", "Que pasara?", 900],
  ["DIAGNOSTICA", "Por que paso?", 1040],
  ["DESCRIPTIVA", "Que paso? Resume datos historicos: reportes, dashboards, indicadores.", 1180]
];
const top_y = y + 150;
const lvl_h = 150;
levels.forEach(([name, desc, lw], i) => {
  const ly = top_y + i * (lvl_h + 15);
  const lx = x + (w - lw) / 2;
  const bg = name === "PRESCRIPTIVA" ? STICKY : WHITE;
  card(lx, ly, lw, lvl_h, `${name}\n${desc}`, fid, bg, BORDER, 13, name === "PRESCRIPTIVA" ? 2 : 1.5, "center");
});

// 4. PRESCRIPTIVA EN ACCION -> A CEREBRO
[w, h] = [2200, 1300];
[x, y] = place(w, h);
fid = frame(x, y, w, h, "04 Prescriptiva en accion");
label_tag(fid, x, y, "PRESCRIPTIVA EN ACCION", "A", "CEREBRO");
const [node_w, node_h] = [280, 280];
const node_x = x + 60;
const node_y = y + h / 2 - node_h / 2 + 40;
const eid = ellipse(node_x, node_y, node_w, node_h, WHITE, INK, fid, 3);
bind_text(eid, node_x + 15, node_y, node_w - 30, node_h, "PRESCRIPTIVA\nEN ACCION", fid, 19, INK, "center", 1);

const clusters = [
  ["APLICACIONES", [
    "Produccion: cuanto fabricar?",
    "Logistica: que ruta seguir?",
    "Personal: como asignar turnos?",
    "Compras: cuanto y cuando pedir?",
    "Finanzas: como asignar presupuesto?",
    "Marketing: como distribuir inversion?"
  ]],
  ["INSUMOS DEL MODELO", [
    "Datos operativos: tiempos y costos",
    "Recursos: personal, maquinaria, dinero",
    "Restricciones: turnos, horarios, limites",
    "Objetivos: costos, ingresos, eficiencia"
  ]],
  ["RETOS DE IMPLEMENTACION", [
    "Datos de mala calidad",
    "Falta de entendimiento del modelo",
    "Complejidad en la formulacion",
    "Resistencia al cambio",
    "Limitaciones tecnologicas"
  ]]
];
const cx0 = node_x + node_w + 90;
const col_w_c = (x + w - 40 - cx0) / 3 - 30;
const top_c = y + 90;
clusters.forEach(([ctitle, items], ci) => {
  const clx = cx0 + ci * (col_w_c + 30);
  sticky_label(clx, top_c, ctitle, fid, ci % 2 === 0 ? -2 : 2, 14);
  arrow(node_x + node_w, node_y + node_h / 2, clx, top_c + 40, fid, INK, ci === 2);
  let iy = top_c + 80;
  items.forEach(it => {
    card(clx, iy, col_w_c, 72, it, fid, ci === 2 ? PAIN_BG : WHITE, ci === 2 ? PAIN : BORDER, 12);
    iy += 72 + 14;
  });
});

// 5. DECISIONES Y RIESGO -> G MATRIZ
[w, h] = [2200, 1250];
[x, y] = place(w, h);
fid = frame(x, y, w, h, "05 Decisiones y riesgo");
label_tag(fid, x, y, "DECISIONES Y RIESGO", "G", "MATRIZ");
const half = w / 2 - 60;
const lx_sec5 = x + 40;
const rx_sec5 = x + w / 2 + 20;
const ty_dr = y + 90;
free_text(lx_sec5, ty_dr, half, 30, "ESTRUCTURADA", fid, 15, INK, "left", 1);
free_text(rx_sec5, ty_dr, half, 30, "NO ESTRUCTURADA", fid, 15, PAIN, "left", 1);
const left_items = [
  "Cuanto producir de cada referencia.",
  "Que ruta de entrega elegir.",
  "Como asignar recursos entre tareas."
];
const right_items = [
  "Contratar a un gerente.",
  "Lanzar un nuevo producto al mercado."
];
let iy_dr = ty_dr + 40;
left_items.forEach(it => {
  card(lx_sec5, iy_dr, half, 62, it, fid, WHITE, BORDER, 12);
  iy_dr += 62 + 12;
});
iy_dr = ty_dr + 40;
right_items.forEach(it => {
  card(rx_sec5, iy_dr, half, 62, it, fid, PAIN_BG, PAIN, 12);
  iy_dr += 62 + 12;
});

const ty2_dr = ty_dr + 300;
free_text(lx_sec5, ty2_dr, half, 30, "INCERTIDUMBRE", fid, 15, INK, "left", 1);
free_text(rx_sec5, ty2_dr, half, 30, "RIESGO", fid, 15, INK, "left", 1);
const pairs = [
  ["No se conocen resultados ni\nprobabilidades.", "Se conocen o estiman consecuencias\ny probabilidades."],
  ["Producto nuevo: no hay\ndatos historicos.", "Aseguradora: 2% de autos\ntiene accidentes al ano."],
  ["Situaciones novedosas o\nsin precedentes.", "Situaciones repetibles con\nhistorial suficiente."],
  ["Juicio experto, escenarios,\nanalisis de sensibilidad.", "Valor esperado, simulacion,\narboles de decision."]
];
iy_dr = ty2_dr + 40;
pairs.forEach(([l, r]) => {
  card(lx_sec5, iy_dr, half, 80, l, fid, WHITE, BORDER, 12);
  card(rx_sec5, iy_dr, half, 80, r, fid, WHITE, BORDER, 12);
  iy_dr += 80 + 12;
});

const sy = iy_dr + 50;
hline(x + 80, sy + 20, x + w - 80, fid, INK, false, 2);
const spec = [
  ["CERTEZA", "Se conoce con exactitud\nque va a ocurrir."],
  ["RIESGO", "Resultados y probabilidades\nse pueden estimar."],
  ["INCERTIDUMBRE", "Ni resultados ni\nprobabilidades se conocen."]
];
const sx = x + 80;
const spacing = (w - 160 - 260) / 2;
spec.forEach(([t, d], i) => {
  const px = sx + i * (spacing + 260);
  ellipse(px, sy + 5, 30, 30, HEAD_BG, HEAD_BG, fid, 1.5);
  card(px - 40, sy + 50, 260, 110, `${t}\n${d}`, fid, WHITE, BORDER, 12, 1.5, "center");
});

// 6. MODELOS DE DECISION -> C FLUJO
[w, h] = [2200, 1300];
[x, y] = place(w, h);
fid = frame(x, y, w, h, "06 Modelos de decision");
label_tag(fid, x, y, "MODELOS DE DECISION", "C", "FLUJO");
const flow = [
  ["VARIABLES DE DECISION", "Lo que se desea\ndeterminar o controlar."],
  ["RESTRICCIONES", "Condiciones del entorno\nque deben cumplirse."],
  ["FUNCION OBJETIVO", "Criterio que se desea\nmaximizar o minimizar."]
];
const fb_w = 460, fb_h = 150;
const fx0 = x + (w - 3 * fb_w - 2 * 60) / 2;
const fy0 = y + 90;
const pts_f = [];
flow.forEach(([t, d], i) => {
  const fx = fx0 + i * (fb_w + 60);
  card(fx, fy0, fb_w, fb_h, `${t}\n${d}`, fid, WHITE, BORDER, 13, 2);
  pts_f.push([fx, fy0]);
});
for (let i = 0; i < 2; i++) {
  const [x1, y1] = pts_f[i];
  const [x2, y2] = pts_f[i + 1];
  arrow(x1 + fb_w, y1 + fb_h / 2, x2, y2 + fb_h / 2, fid);
}

let cy_m = fy0 + fb_h + 70;
sticky_label(x + 40, cy_m, "CASO RESUELTO: SILLAS Y MESAS", fid, -2, 15);
cy_m += 70;
const case_text = "Silla: 2h trabajo, 3 madera, $30 ganancia. Mesa: 4h trabajo, 2 madera, $50 ganancia.\nDisponible: 40h trabajo, 30 madera.";
free_text(x + 40, cy_m, w - 80, 50, case_text, fid, 13);
cy_m += 60;
const case_cards = [
  ["VARIABLES", "x = sillas a producir\ny = mesas a producir"],
  ["RESTRICCIONES", "2x+4y <= 40 (horas)\n3x+2y <= 30 (madera)\nx,y >= 0"],
  ["FUNCION OBJETIVO", "Maximizar Z = 30x + 50y\n(aun sin resolver el optimo)"]
];
let ccx = x + 40;
case_cards.forEach(([t, d]) => {
  card(ccx, cy_m, fb_w, 140, `${t}\n${d}`, fid, STICKY, BORDER, 12);
  ccx += fb_w + 60;
});

let ty_m = cy_m + 180;
sticky_label(x + 40, ty_m, "TALLER: FORMULA TU (CASO 2 Y 3)", fid, -2, 15);
ty_m += 70;
const casos = [
  ["CASO 2 - Minimizar costo", "Pedido minimo 10 unid. Silla $15, mesa $25.\nPresupuesto maximo $250."],
  ["CASO 3 - Maximizar unidades", "60h/semana. Silla 3h, mesa 5h.\nMinimo 5 sillas por semana."]
];
let tcx = x + 40;
casos.forEach(([t, d]) => {
  card(tcx, ty_m, fb_w + 120, 150, `${t}\n${d}\nPaso 1: variables  Paso 2: restricciones  Paso 3: f. objetivo`, fid, WHITE, BORDER, 12);
  tcx += fb_w + 120 + 60;
});

// 7. TALLER DE REPASO -> J TIMELINE
[w, h] = [2500, 700];
[x, y] = place(w, h);
fid = frame(x, y, w, h, "07 Taller de repaso");
label_tag(fid, x, y, "TALLER DE REPASO", "J", "TIMELINE");
const ejercicios = [
  "1. Escritorios y bibliotecas: max unidades (36h carpinteria)",
  "2. + melamina y ganancias: max ganancia",
  "3. + minimo 8 escritorios por contrato",
  "4. + camas (3er producto)",
  "5. + limite de almacenamiento (25 unid)",
  "6. + horas de acabado (2do recurso)",
  "7. + 2 proveedores de melamina",
  "8. + limite 20% camas del total",
  "9. + planeacion a 2 semanas con inventario",
  "10. + turno extra opcional ($400 fijos)"
];
const line_y = y + h * 0.5;
hline(x + 60, line_y, x + w - 60, fid, INK, false, 2);
const n_ex = ejercicios.length;
const step_ex = (w - 120) / (n_ex - 1);
ejercicios.forEach((ex, i) => {
  const px = x + 60 + i * step_ex;
  ellipse(px - 9, line_y - 9, 18, 18, HEAD_BG, HEAD_BG, fid, 1.5);
  const above = i % 2 === 0;
  const ty_e = above ? line_y - 160 : line_y + 30;
  card(px - 95, ty_e, 220, 120, ex, fid, i < 9 ? WHITE : PAIN_BG, i < 9 ? BORDER : PAIN, 11);
  vline(px, line_y, ty_e + (above ? 0 : 120), fid, DASH, true);
});

// 8. CIERRE -> K BOARD
[w, h] = [2200, 1250];
[x, y] = place(w, h);
fid = frame(x, y, w, h, "08 Cierre");
label_tag(fid, x, y, "CIERRE", "K", "BOARD");
const lane_w = (w - 2 * 40 - 3 * 40) / 4;
const lanes = [
  ["SINTESIS", [
    "3 parciales (75%) + proyecto\nequipo (20%) + articulo (5%).",
    "5 niveles de analitica; el curso\nse enfoca en la prescriptiva.",
    "Prescriptiva necesita datos,\nrecursos, restricciones, objetivos.",
    "Solo decisiones estructuradas\nse modelan matematicamente.",
    "Incertidumbre != riesgo: el riesgo\ntiene probabilidades estimables.",
    "Todo modelo tiene variables,\nrestricciones y funcion objetivo."
  ]],
  ["PROXIMA CLASE", [
    "Identificar un problema real\ncandidato para el proyecto.",
    "Entregable: ficha descriptiva\ndel problema (contextualizacion)."
  ]],
  ["AUTOEVALUACION", [
    "Explico los 5 tipos de analitica.",
    "Doy ejemplo de decision\nestructurada y no estructurada.",
    "Diferencio incertidumbre de\nriesgo con ejemplo propio.",
    "Identifico variables, restricciones\ny funcion objetivo en un caso."
  ]],
  ["BIBLIOGRAFIA", [
    "Hillier & Lieberman (2010).\nIntroduccion a la inv. de operaciones.",
    "Winston (2005). Investigacion\nde operaciones: Apps y algoritmos.",
    "IBM: What Is Prescriptive Analytics?",
    "MIT News: Knightian uncertainty",
    "MIT OCW: The Analytics Edge",
    "Coursera Dartmouth: Prescriptive Analytics"
  ]]
];
lanes.forEach(([ltitle, items], li) => {
  const llx = x + 40 + li * (lane_w + 40);
  sticky_label(llx, y + 90, ltitle, fid, li % 2 === 0 ? -2 : 2, 14);
  let iy = y + 170;
  items.forEach(it => {
    card(llx, iy, lane_w, 90, it, fid, WHITE, BORDER, 11);
    iy += 90 + 14;
  });
  if (li > 0) {
    vline(llx - 20, y + 90, y + h - 40, fid);
  }
});

free_text(0, -190, 2400, 90, "OPTIMIZACION 05359-IND - CLASE 1: INTRODUCCION AL ANALISIS DE DECISIONES", null, 42, INK, "left", 1);
free_text(0, -105, 2400, 40, "Universidad Icesi - Fac. Barberi de Ingenieria, Diseno y Ciencias Aplicadas - cada seccion usa el motor visual que mejor encaja", null, 15, "#5c5c5c");

const scene = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements: elements,
  appState: {
    gridSize: 20,
    viewBackgroundColor: "#F4F4F4"
  },
  files: {}
};

const targetPath = path.join(__dirname, '../examples/clase_1.excalidraw');
fs.writeFileSync(targetPath, JSON.stringify(scene, null, 2), 'utf-8');
console.log("Compilacion de clase_1.excalidraw finalizada. Elementos vectoriales creados:", elements.length);
