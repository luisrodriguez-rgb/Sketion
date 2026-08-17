const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_TEMPLATES_DIR = path.join(ROOT_DIR, "excalidraw-app", "public", "templates");
const DATA_TEMPLATES_DIR = path.join(ROOT_DIR, "excalidraw-app", "data", "templates");

const CATEGORY_META = {
  estudio: {
    slug: "estudio",
    name: "Estudio",
    icon: "🎓",
    description: "Apuntes de clase, mapas mentales, síntesis y preparación de exámenes",
    tsFileName: "estudio.ts",
    exportName: "ESTUDIO_TEMPLATES",
    titles: {
      "01_study_notes": { name: "Study Notes & Class Synthesis", desc: "Síntesis estructurada con preguntas clave, notas detalladas y resumen ejecutivo.", featured: true },
      "02_mind_map": { name: "Mind Map Conceptual", desc: "Organización radial de conceptos alrededor de una idea central y ramas balanceadas.", featured: true },
      "03_concept_map": { name: "Mapa Conceptual", desc: "Nodos jerárquicos con proposiciones y conectores semánticos.", featured: false },
      "04_reading_summary": { name: "Resumen de Lectura", desc: "Ficha de lectura con tesis del autor, argumentos centrales y conclusiones.", featured: false },
      "05_exam_prep": { name: "Preparación de Parcial", desc: "Matriz de seguimiento por tema, nivel de dificultad y ejercicios clave.", featured: true },
      "06_flashcard_board": { name: "Flashcard Board", desc: "Tablero de tarjetas de memorización activa (Active Recall).", featured: false },
      "07_research_canvas": { name: "Research Canvas", desc: "Pregunta de investigación, hipótesis, metodología y fuentes académicas.", featured: false },
      "08_cornell_notes": { name: "Cornell Notes", desc: "Sistema clásico de toma de apuntes Cornell con área de notas y resumen.", featured: false },
      "09_lecture_review": { name: "Lecture Review", desc: "Retención post-clase: ideas principales, dudas y aplicación real.", featured: false },
      "10_learning_roadmap": { name: "Learning Roadmap", desc: "Ruta de aprendizaje escalonada por fases de dominio y hitos clave.", featured: false },
    },
  },
  ingenieria: {
    slug: "ingenieria",
    name: "Ingeniería",
    icon: "⚙️",
    description: "SIPOC, VSM, Ishikawa, FMEA, Pareto y análisis de procesos industriales",
    tsFileName: "ingenieria.ts",
    exportName: "INGENIERIA_TEMPLATES",
    titles: {
      "01_sipoc": { name: "SIPOC Process Analysis", desc: "Análisis de alto nivel de flujo de valor (Suppliers, Inputs, Process, Outputs, Customers).", featured: true },
      "02_value_stream_mapping": { name: "Value Stream Mapping (VSM)", desc: "Mapeo de flujo de valor y medición de tiempos Lead Time / Cycle Time.", featured: true },
      "03_process_map": { name: "Process Map", desc: "Diagrama de flujo de operaciones con nodos de decisión y puntos de control.", featured: false },
      "04_fishbone_ishikawa": { name: "Fishbone / Ishikawa", desc: "Diagnóstico de causa-efecto con las 6Ms de calidad industrial.", featured: true },
      "05_fmea": { name: "FMEA (Failure Mode & Effects)", desc: "Análisis de modos y efectos de fallos con cálculo de RPN.", featured: false },
      "06_pareto_analysis": { name: "Pareto Analysis (80/20)", desc: "Gráfico 80/20 de causas críticas y porcentaje acumulado.", featured: false },
      "07_risk_matrix": { name: "Risk Matrix", desc: "Matriz de evaluación de riesgos (Probabilidad vs Impacto).", featured: false },
      "08_capacity_planning": { name: "Capacity Planning", desc: "Identificación de cuellos de botella y balanceo de líneas de producción.", featured: false },
      "09_root_cause_analysis": { name: "Root Cause Analysis (5 Whys)", desc: "Cadena causal secuencial de 5 porqués hasta la causa raíz.", featured: false },
      "10_continuous_improvement_kaizen": { name: "Continuous Improvement (PDCA)", desc: "Ciclo de Deming / Kaizen (Plan, Do, Check, Act) para mejora continua.", featured: false },
    },
  },
  software_ia: {
    slug: "software_ia",
    name: "Software & IA",
    icon: "💻",
    description: "System Design, arquitecturas, APIs, diagramas ER, agentes IA y RAG",
    tsFileName: "software_ia.ts",
    exportName: "SOFTWARE_IA_TEMPLATES",
    titles: {
      "01_system_design": { name: "System Design Architecture", desc: "Diseño de sistemas escalables (DNS, LB, Microservicios, Cache, BD).", featured: true },
      "02_software_architecture": { name: "Software Architecture", desc: "Arquitectura multicapa en VPC con fronteras de seguridad.", featured: false },
      "03_api_architecture": { name: "API Architecture & Gateway", desc: "API Gateway, enrutamiento, rate limiting y contratos de microservicios.", featured: false },
      "04_database_schema": { name: "Database Schema (ER Model)", desc: "Esquema relacional con tablas, claves PK/FK y tipos de datos.", featured: true },
      "05_microservices_architecture": { name: "Microservices Architecture", desc: "Clúster de servicios desacoplados con contratos de comunicación.", featured: false },
      "06_event_driven_architecture": { name: "Event-Driven Architecture", desc: "Bus de eventos Apache Kafka con productores y workers consumidores.", featured: false },
      "07_user_flow": { name: "Software User Flow", desc: "Flujo lógico de interacción del sistema y ramas condicionales.", featured: false },
      "08_sequence_diagram": { name: "Sequence Diagram", desc: "Mensajes sincrónicos y asíncronos en el tiempo sobre lifelines.", featured: false },
      "09_ai_agent_architecture": { name: "AI Agent Architecture", desc: "Agente autónomo con memoria episódica, LLM Brain y Tool Calling.", featured: true },
      "10_rag_architecture": { name: "RAG Architecture", desc: "Pipeline RAG: Ingestión, Embeddings, Vector DB y Grounded LLM.", featured: false },
      "11_ai_workflow": { name: "AI Workflow (Human-in-the-Loop)", desc: "Flujo con carriles de automatización y supervisión humana.", featured: false },
      "12_prompt_engineering_framework": { name: "Prompt Engineering Framework", desc: "Marco estructurado para diseño de prompts empresariales.", featured: false },
    },
  },
  negocios: {
    slug: "negocios",
    name: "Negocios & Producto",
    icon: "💼",
    description: "Lean Canvas, FODA, Business Model, Product Roadmaps y matrices de decisión",
    tsFileName: "negocios.ts",
    exportName: "NEGOCIOS_TEMPLATES",
    titles: {
      "01_business_model_canvas": { name: "Business Model Canvas", desc: "Los 9 bloques tradicionales de Osterwalder para modelos de negocio.", featured: false },
      "02_lean_canvas": { name: "Lean Canvas", desc: "Framework de Ash Maurya enfocado en validación rápida de startups.", featured: true },
      "03_swot_foda": { name: "SWOT / FODA", desc: "Matriz 2x2 de factores internos (F/D) y externos (O/A).", featured: true },
      "04_product_vision_board": { name: "Product Vision Board", desc: "Alineación de visión, público objetivo, necesidades y propuesta de valor.", featured: false },
      "05_product_roadmap": { name: "Product Roadmap (Now, Next, Later)", desc: "Horizontes estratégicos de producto con epics e hitos clave.", featured: true },
      "06_okr_planner": { name: "OKR Planner", desc: "Objetivos estratégicos y resultados clave cuantitativos medibles.", featured: false },
      "07_decision_matrix": { name: "Decision Matrix", desc: "Ponderación multicriterio para toma de decisiones tecnológicas.", featured: false },
      "08_eisenhower_matrix": { name: "Eisenhower Matrix", desc: "Matriz de urgencia vs importancia para priorización ejecutiva.", featured: false },
      "09_stakeholder_map": { name: "Stakeholder Map", desc: "Mapeo de interesados por nivel de poder e interés.", featured: false },
      "10_go_to_market_plan": { name: "Go-To-Market (GTM) Plan", desc: "Fases secuenciales de lanzamiento y penetración de mercado.", featured: false },
    },
  },
  diseno_ux: {
    slug: "diseno_ux",
    name: "Diseño & UX",
    icon: "🎨",
    description: "Customer Journey, mapas de empatía, personas, flujos y Design Sprints",
    tsFileName: "diseno_ux.ts",
    exportName: "DISENO_UX_TEMPLATES",
    titles: {
      "01_customer_journey_map": { name: "Customer Journey Map", desc: "Trayectoria del cliente, puntos de contacto y curva emocional.", featured: true },
      "02_user_journey_map": { name: "User Journey Map", desc: "Mapeo de interacción paso a paso para un flujo específico de usuario.", featured: false },
      "03_empathy_map": { name: "Empathy Map", desc: "Cuadrantes de empatía: qué dice, piensa, hace y siente el usuario.", featured: false },
      "04_persona_canvas": { name: "Persona Canvas", desc: "Arquetipo de usuario con metas, dolores, motivaciones y herramientas.", featured: false },
      "05_user_flow": { name: "UX User Flow", desc: "Diagrama de flujo de pantallas y bifurcaciones de experiencia de usuario.", featured: false },
      "06_wireframe_board": { name: "Wireframe Board", desc: "Estructuras de baja fidelidad para maquetación y arquitectura de layouts.", featured: false },
      "07_design_critique": { name: "Design Critique", desc: "Sesión de feedback estructurado: aspectos positivos, dudas y mejoras.", featured: false },
      "08_ux_research_board": { name: "UX Research Board", desc: "Consolidación de hallazgos, insights y citas textuales de usuarios.", featured: false },
      "09_heuristic_evaluation": { name: "Heuristic Evaluation", desc: "Evaluación de las 10 heurísticas de usabilidad de Jakob Nielsen.", featured: false },
      "10_design_sprint": { name: "Design Sprint (5 Días)", desc: "Tablero metodológico de 5 fases de Google Design Sprint.", featured: false },
    },
  },
  productividad: {
    slug: "productividad",
    name: "Productividad",
    icon: "📈",
    description: "Tableros Kanban, retrospectivas ágiles, minutas y planificadores",
    tsFileName: "productividad.ts",
    exportName: "PRODUCTIVIDAD_TEMPLATES",
    titles: {
      "01_kanban_board": { name: "Kanban Board", desc: "Gestión visual de flujo de trabajo con 4 columnas y tarjetas de estado.", featured: true },
      "02_weekly_planner": { name: "Weekly Planner", desc: "Planificación semanal de Lunes a Viernes con bloques de prioridades.", featured: false },
      "03_daily_planner": { name: "Daily Planner", desc: "Enfoque diario: Top 3 prioridades, timeblocking y notas de reflexión.", featured: false },
      "04_time_blocking": { name: "Time Blocking", desc: "Bloques temporales estructurados para Deep Work, reuniones y administración.", featured: false },
      "05_habit_tracker": { name: "Habit Tracker", desc: "Matriz mensual de seguimiento de hábitos y constancia diaria.", featured: false },
      "06_meeting_notes": { name: "Meeting Notes", desc: "Registro estructurado de reuniones: objetivo, acuerdos y responsables.", featured: false },
      "07_action_items": { name: "Action Items Matrix", desc: "Matriz de seguimiento de tareas con deadlines, responsable y estado.", featured: false },
      "08_sprint_retrospective": { name: "Sprint Retrospective", desc: "Dinámica de retrospectiva ágil: ¿Qué funcionó bien? y ¿Qué podemos mejorar?", featured: true },
      "09_team_alignment": { name: "Team Alignment Canvas", desc: "Canvas de acuerdos, roles, normas y misión compartida del equipo.", featured: false },
      "10_priority_matrix": { name: "Priority Matrix (Impacto vs Esfuerzo)", desc: "Matriz de impacto vs esfuerzo para priorización estratégica de backlog.", featured: false },
    },
  },
};

const featuredIds = [];

console.log("🚀 Sincronizando catálogo TypeScript desde archivos reales de public/templates...");

for (const [catKey, catInfo] of Object.entries(CATEGORY_META)) {
  const catDir = path.join(PUBLIC_TEMPLATES_DIR, catKey);
  if (!fs.existsSync(catDir)) {
    console.warn(`Directorio no encontrado: ${catDir}`);
    continue;
  }

  const excalFiles = fs.readdirSync(catDir).filter((f) => f.endsWith(".excalidraw")).sort();
  const templateObjects = [];

  for (const fileName of excalFiles) {
    const fileBase = fileName.replace(".excalidraw", "");
    const excalPath = path.join(catDir, fileName);
    const svgPath = path.join(catDir, `${fileBase}.svg`);

    const excalRaw = fs.readFileSync(excalPath, "utf8");
    const excalData = JSON.parse(excalRaw);

    let svgRaw = "";
    if (fs.existsSync(svgPath)) {
      svgRaw = fs.readFileSync(svgPath, "utf8");
    }

    const meta = catInfo.titles[fileBase] || {
      name: fileBase.replace(/^\d+_/, "").replace(/_/g, " ").toUpperCase(),
      desc: "Plantilla profesional estructurada para tu lienzo de trabajo.",
      featured: false,
    };

    if (meta.featured) {
      featuredIds.push(fileBase);
    }

    const templateObj = {
      id: fileBase,
      name: meta.name,
      description: meta.desc,
      icon: catInfo.icon,
      category: catInfo.name,
      categorySlug: catInfo.slug,
      isFeatured: meta.featured,
      filePath: `/templates/${catKey}/${fileName}`,
      thumbnailUrl: `/templates/${catKey}/${fileBase}.svg`,
      thumbnailSvg: svgRaw.trim(),
      elements: excalData.elements || [],
      appState: excalData.appState || { viewBackgroundColor: "#F8FAFC" },
    };

    templateObjects.push(templateObj);
  }

  // Write TS file
  const tsContent = `import { Template, TemplateMetadata } from "./types";

// Element data maps for fast 0ms instant loading
const ELEMENTS_MAP: Record<string, any[]> = ${JSON.stringify(
    templateObjects.reduce((acc, t) => {
      acc[t.id] = t.elements;
      return acc;
    }, {}),
    null,
    2,
  )};

const APP_STATE_MAP: Record<string, any> = ${JSON.stringify(
    templateObjects.reduce((acc, t) => {
      acc[t.id] = t.appState;
      return acc;
    }, {}),
    null,
    2,
  )};

const RAW_META: TemplateMetadata[] = ${JSON.stringify(
    templateObjects.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      category: t.category,
      categorySlug: t.categorySlug,
      isFeatured: t.isFeatured,
      filePath: t.filePath,
      thumbnailUrl: t.thumbnailUrl,
      thumbnailSvg: t.thumbnailSvg,
    })),
    null,
    2,
  )};

export const ${catInfo.exportName}: Template[] = RAW_META.map((tmpl) => ({
  ...tmpl,
  getElements: () => ELEMENTS_MAP[tmpl.id] || [],
  getAppState: () => APP_STATE_MAP[tmpl.id] || { viewBackgroundColor: "#F8FAFC" },
}));
`;

  const tsFilePath = path.join(DATA_TEMPLATES_DIR, catInfo.tsFileName);
  fs.writeFileSync(tsFilePath, tsContent, "utf8");
  console.log(`  ✓ Generado ${catInfo.tsFileName} (${templateObjects.length} plantillas)`);
}

// Write featured.ts
const featuredContent = `export const FEATURED_TEMPLATE_IDS: string[] = ${JSON.stringify(featuredIds, null, 2)};
`;
fs.writeFileSync(path.join(DATA_TEMPLATES_DIR, "featured.ts"), featuredContent, "utf8");
console.log(`  ✓ Generado featured.ts (${featuredIds.length} IDs destacados: ${featuredIds.join(", ")})`);

// Write types.ts
const typesContent = `export type TemplateCategorySlug =
  | "todos"
  | "estudio"
  | "ingenieria"
  | "software_ia"
  | "negocios"
  | "diseno_ux"
  | "productividad";

export interface TemplateCategoryInfo {
  slug: TemplateCategorySlug;
  name: string;
  icon: string;
  description: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  categorySlug: TemplateCategorySlug;
  tags?: string[];
  isFeatured?: boolean;
  filePath: string;
  thumbnailUrl: string;
  thumbnailSvg: string;
}

export interface Template extends TemplateMetadata {
  getElements: (content?: Record<string, any>) => any[];
  getAppState?: () => Record<string, any>;
}
`;
fs.writeFileSync(path.join(DATA_TEMPLATES_DIR, "types.ts"), typesContent, "utf8");
console.log(`  ✓ Actualizado types.ts`);

// Write index.ts
const indexContent = `import { Template, TemplateCategoryInfo, TemplateCategorySlug } from "./types";
import { ESTUDIO_TEMPLATES } from "./estudio";
import { INGENIERIA_TEMPLATES } from "./ingenieria";
import { SOFTWARE_IA_TEMPLATES } from "./software_ia";
import { NEGOCIOS_TEMPLATES } from "./negocios";
import { DISENO_UX_TEMPLATES } from "./diseno_ux";
import { PRODUCTIVIDAD_TEMPLATES } from "./productividad";
import { FEATURED_TEMPLATE_IDS } from "./featured";

export * from "./types";
export * from "./featured";

export const CATEGORIES: TemplateCategoryInfo[] = [
  {
    slug: "todos",
    name: "Todos",
    icon: "✨",
    description: "Colección curada completa de 62 plantillas vectoriales profesionales",
  },
  {
    slug: "estudio",
    name: "Estudio",
    icon: "🎓",
    description: "Apuntes de clase, mapas conceptuales, fichas de lectura y preparación de parciales",
  },
  {
    slug: "ingenieria",
    name: "Ingeniería",
    icon: "⚙️",
    description: "SIPOC, VSM, Ishikawa, FMEA, análisis de Pareto y matrices de riesgo",
  },
  {
    slug: "software_ia",
    name: "Software & IA",
    icon: "💻",
    description: "System design, microservicios, bases de datos relacionales, arquitecturas de agentes IA y RAG",
  },
  {
    slug: "negocios",
    name: "Negocios & Producto",
    icon: "💼",
    description: "Lean Canvas, FODA, Product Roadmaps, OKRs y matrices estratégicas",
  },
  {
    slug: "diseno_ux",
    name: "Diseño & UX",
    icon: "🎨",
    description: "Customer Journey, mapas de empatía, personas, flujos de navegación y Design Sprints",
  },
  {
    slug: "productividad",
    name: "Productividad",
    icon: "📈",
    description: "Tableros Kanban, retrospectivas de equipo, minutas de reunión y planificadores",
  },
];

export const TEMPLATES: Template[] = [
  ...ESTUDIO_TEMPLATES,
  ...INGENIERIA_TEMPLATES,
  ...SOFTWARE_IA_TEMPLATES,
  ...NEGOCIOS_TEMPLATES,
  ...DISENO_UX_TEMPLATES,
  ...PRODUCTIVIDAD_TEMPLATES,
];

export const getFeaturedTemplates = (): Template[] => {
  const featuredSet = new Set(FEATURED_TEMPLATE_IDS);
  return TEMPLATES.filter((t) => featuredSet.has(t.id) || t.isFeatured);
};

export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find((t) => t.id === id);
};

export const getTemplatesByCategory = (slug: TemplateCategorySlug): Template[] => {
  if (slug === "todos") return TEMPLATES;
  return TEMPLATES.filter((t) => t.categorySlug === slug);
};

export const searchTemplates = (
  query: string,
  categorySlug: TemplateCategorySlug = "todos",
): Template[] => {
  const cleanQuery = query.toLowerCase().trim();
  const list = getTemplatesByCategory(categorySlug);

  if (!cleanQuery) return list;

  return list.filter(
    (tmpl) =>
      tmpl.name.toLowerCase().includes(cleanQuery) ||
      tmpl.description.toLowerCase().includes(cleanQuery) ||
      tmpl.category.toLowerCase().includes(cleanQuery) ||
      tmpl.id.toLowerCase().includes(cleanQuery),
  );
};
`;
fs.writeFileSync(path.join(DATA_TEMPLATES_DIR, "index.ts"), indexContent, "utf8");
console.log(`  ✓ Actualizado index.ts`);

console.log("\n🎉 ¡Sincronización completa con éxito!");
