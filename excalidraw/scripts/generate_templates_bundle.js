const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_TEMPLATES_DIR = path.join(ROOT_DIR, "excalidraw-app", "public", "templates");

const SKETION_COLORS = {
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

let elCounter = 0;
function createBaseElement(type, x, y, width, height, custom = {}) {
  elCounter++;
  return {
    id: `${type}_${Math.random().toString(36).substring(2, 9)}_${elCounter}`,
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
}

function createRectangle(x, y, width, height, custom = {}) {
  return createBaseElement("rectangle", x, y, width, height, custom);
}

function createText(x, y, text, fontSize = 16, custom = {}) {
  return createBaseElement("text", x, y, 200, 30, {
    text,
    fontSize,
    fontFamily: 1,
    strokeColor: SKETION_COLORS.darkStroke,
    textAlign: "center",
    verticalAlign: "middle",
    ...custom,
  });
}

function createArrow(x, y, points, custom = {}) {
  return createBaseElement("arrow", x, y, 100, 100, {
    points,
    strokeColor: SKETION_COLORS.blue,
    strokeWidth: 2,
    ...custom,
  });
}

function createEllipse(x, y, width, height, custom = {}) {
  return createBaseElement("ellipse", x, y, width, height, custom);
}

function createCard(x, y, width, height, title, headerBg = SKETION_COLORS.blueBg, headerColor = SKETION_COLORS.blue, cardBg = "#ffffff") {
  const elements = [];
  const headerHeight = 38;
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
}

function wrapText(text, maxLen = 25) {
  if (!text) return "";
  const words = text.split(" ");
  let currentLine = "";
  const lines = [];
  words.forEach((word) => {
    if ((currentLine + " " + word).trim().length > maxLen) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.join("\n");
}

// Build scene wrapper
function buildExcalidrawScene(elements) {
  return {
    type: "excalidraw",
    version: 2,
    source: "https://sketion.com",
    elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };
}

// Read TS source files directly or extract templates
const templatesDir = path.join(ROOT_DIR, "excalidraw-app", "data", "templates");
const categoryFiles = [
  { slug: "estudio", file: "estudio.ts", arrayName: "ESTUDIO_TEMPLATES" },
  { slug: "ingenieria", file: "ingenieria.ts", arrayName: "INGENIERIA_TEMPLATES" },
  { slug: "software_ia", file: "software_ia.ts", arrayName: "SOFTWARE_IA_TEMPLATES" },
  { slug: "negocios", file: "negocios.ts", arrayName: "NEGOCIOS_TEMPLATES" },
  { slug: "diseno_ux", file: "diseno_ux.ts", arrayName: "DISENO_UX_TEMPLATES" },
  { slug: "productividad", file: "productividad.ts", arrayName: "PRODUCTIVIDAD_TEMPLATES" },
];

console.log("🚀 Iniciando generación de archivos .excalidraw y .svg para las 62 plantillas...");

// We compile and execute via ts-node / esbuild or transpile in-memory
const esbuild = require("esbuild");

async function generateAll() {
  let totalCount = 0;

  for (const cat of categoryFiles) {
    const catOutDir = path.join(PUBLIC_TEMPLATES_DIR, cat.slug);
    fs.mkdirSync(catOutDir, { recursive: true });

    const sourcePath = path.join(templatesDir, cat.file);
    const sourceCode = fs.readFileSync(sourcePath, "utf8");

    // Transpile TS to JS
    const result = await esbuild.transform(sourceCode, {
      loader: "ts",
      format: "cjs",
      target: "node18",
    });

    // Execute transpiled module in a sandbox context
    const mod = { exports: {} };
    const context = {
      module: mod,
      exports: mod.exports,
      require: (id) => {
        if (id === "./types") return {};
        if (id === "./helpers") {
          return {
            SKETION_COLORS,
            createBaseElement,
            createRectangle,
            createText,
            createArrow,
            createEllipse,
            createCard,
            wrapText,
          };
        }
        return require(id);
      },
    };

    const func = new Function("module", "exports", "require", result.code);
    func(mod, mod.exports, context.require);

    const templates = mod.exports[cat.arrayName];
    if (!Array.isArray(templates)) {
      console.error(`❌ No se encontró array ${cat.arrayName} en ${cat.file}`);
      continue;
    }

    for (const tmpl of templates) {
      // 1. Generate elements
      const elements = tmpl.getElements ? tmpl.getElements() : [];
      const excalidrawScene = buildExcalidrawScene(elements);

      // Write .excalidraw file
      const excalidrawPath = path.join(catOutDir, `${tmpl.id}.excalidraw`);
      fs.writeFileSync(excalidrawPath, JSON.stringify(excalidrawScene, null, 2), "utf8");

      // Write .svg thumbnail file
      if (tmpl.thumbnailSvg) {
        const svgPath = path.join(catOutDir, `${tmpl.id}.svg`);
        fs.writeFileSync(svgPath, tmpl.thumbnailSvg.trim(), "utf8");
      }

      totalCount++;
      console.log(`  ✓ [${cat.slug}] ${tmpl.name} -> ${tmpl.id}.excalidraw & .svg (${elements.length} elementos)`);
    }
  }

  console.log(`\n🎉 ¡Generación completada exitosamente! ${totalCount} plantillas procesadas en:`);
  console.log(`📂 ${PUBLIC_TEMPLATES_DIR}`);
}

generateAll().catch((err) => {
  console.error("Error fatal generando plantillas:", err);
  process.exit(1);
});
