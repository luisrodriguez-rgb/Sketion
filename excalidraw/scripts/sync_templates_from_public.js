const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_TEMPLATES_DIR = path.join(ROOT_DIR, "excalidraw-app", "public", "templates");
const DATA_TEMPLATES_DIR = path.join(ROOT_DIR, "excalidraw-app", "data", "templates");
const MANIFEST_2_PATH = path.join(__dirname, "templates_2_manifest.json");

let manifest2 = { templates: [] };
if (fs.existsSync(MANIFEST_2_PATH)) {
  try {
    manifest2 = JSON.parse(fs.readFileSync(MANIFEST_2_PATH, "utf8"));
  } catch (err) {
    console.warn("Could not parse templates_2_manifest.json:", err);
  }
}

// Build quick lookup for expansion templates
const extMetaMap = new Map();
for (const tmpl of manifest2.templates || []) {
  extMetaMap.set(tmpl.slug, tmpl);
}

// Core Metadata Definitions
const CORE_TITLES = {
  // Estudio (10)
  "01_study_notes": { name: "Study Notes & Class Synthesis", desc: "Síntesis estructurada con preguntas clave, notas detalladas y resumen ejecutivo.", subcat: "Toma de Apuntes", tier: "core", featured: true },
  "02_mind_map": { name: "Mind Map Conceptual", desc: "Organización radial de conceptos alrededor de una idea central y ramas balanceadas.", subcat: "Mapas & Esquemas", tier: "core", featured: true },
  "03_concept_map": { name: "Mapa Conceptual", desc: "Nodos jerárquicos con proposiciones y conectores semánticos.", subcat: "Mapas & Esquemas", tier: "core", featured: true },
  "04_reading_summary": { name: "Resumen de Lectura", desc: "Ficha de lectura con tesis del autor, argumentos centrales y conclusiones.", subcat: "Lectura & Análisis", tier: "specialized", featured: false },
  "05_exam_prep": { name: "Preparación de Parcial", desc: "Matriz de seguimiento por tema, nivel de dificultad y ejercicios clave.", subcat: "Evaluación & Exámenes", tier: "core", featured: true },
  "06_flashcard_board": { name: "Flashcard Board", desc: "Tablero de tarjetas de memorización activa (Active Recall).", subcat: "Memorización Activa", tier: "specialized", featured: false },
  "07_research_canvas": { name: "Research Canvas", desc: "Pregunta de investigación, hipótesis, metodología y fuentes académicas.", subcat: "Investigación Académica", tier: "specialized", featured: false },
  "08_cornell_notes": { name: "Cornell Notes", desc: "Sistema clásico de toma de apuntes Cornell con área de notas y resumen.", subcat: "Toma de Apuntes", tier: "core", featured: true },
  "09_lecture_review": { name: "Lecture Review", desc: "Retención post-clase: ideas principales, dudas y aplicación real.", subcat: "Toma de Apuntes", tier: "specialized", featured: false },
  "10_learning_roadmap": { name: "Learning Roadmap", desc: "Ruta de aprendizaje escalonada por fases de dominio e hitos clave.", subcat: "Planificación Académica", tier: "core", featured: true },

  // Ingeniería (10)
  "01_sipoc": { name: "SIPOC Process Analysis", desc: "Análisis de alto nivel de flujo de valor (Suppliers, Inputs, Process, Outputs, Customers).", subcat: "Procesos Industriales", tier: "core", featured: true },
  "02_value_stream_mapping": { name: "Value Stream Mapping (VSM)", desc: "Mapeo de flujo de valor y medición de tiempos Lead Time / Cycle Time.", subcat: "Lean Manufacturing", tier: "core", featured: true },
  "03_process_map": { name: "Process Map", desc: "Diagrama de flujo de operaciones con nodos de decisión y puntos de control.", subcat: "Procesos Industriales", tier: "core", featured: true },
  "04_fishbone_ishikawa": { name: "Fishbone / Ishikawa", desc: "Diagnóstico de causa-efecto con las 6Ms de calidad industrial.", subcat: "Calidad & Causa Raíz", tier: "core", featured: true },
  "05_fmea": { name: "FMEA (Failure Mode & Effects)", desc: "Análisis de modos y efectos de fallos con cálculo de RPN.", subcat: "Gestión de Riesgo & Calidad", tier: "core", featured: true },
  "06_pareto_analysis": { name: "Pareto Analysis (80/20)", desc: "Gráfico 80/20 de causas críticas y porcentaje acumulado.", subcat: "Calidad & Causa Raíz", tier: "specialized", featured: false },
  "07_risk_matrix": { name: "Risk Matrix", desc: "Matriz de evaluación de riesgos (Probabilidad vs Impacto).", subcat: "Gestión de Riesgo & Calidad", tier: "specialized", featured: false },
  "08_capacity_planning": { name: "Capacity Planning", desc: "Identificación de cuellos de botella y balanceo de líneas de producción.", subcat: "Capacidad & Operaciones", tier: "specialized", featured: false },
  "09_root_cause_analysis": { name: "Root Cause Analysis (5 Whys)", desc: "Cadena causal secuencial de 5 porqués hasta la causa raíz.", subcat: "Calidad & Causa Raíz", tier: "specialized", featured: false },
  "10_continuous_improvement_kaizen": { name: "Continuous Improvement (PDCA)", desc: "Ciclo de Deming / Kaizen (Plan, Do, Check, Act) para mejora continua.", subcat: "Lean Manufacturing", tier: "specialized", featured: false },

  // Software & IA (12)
  "01_system_design": { name: "System Design Architecture", desc: "Diseño de sistemas escalables (DNS, LB, Microservicios, Cache, BD).", subcat: "System Design & Cloud", tier: "core", featured: true },
  "02_software_architecture": { name: "Software Architecture", desc: "Arquitectura multicapa en VPC con fronteras de seguridad.", subcat: "Arquitectura de Software", tier: "core", featured: true },
  "03_api_architecture": { name: "API Architecture & Gateway", desc: "API Gateway, enrutamiento, rate limiting y contratos de microservicios.", subcat: "APIs & Servicios", tier: "core", featured: true },
  "04_database_schema": { name: "Database Schema (ER Model)", desc: "Esquema relacional con tablas, claves PK/FK y tipos de datos.", subcat: "Bases de Datos", tier: "core", featured: true },
  "05_microservices_architecture": { name: "Microservices Architecture", desc: "Clúster de servicios desacoplados con contratos de comunicación.", subcat: "Microservicios", tier: "core", featured: true },
  "06_event_driven_architecture": { name: "Event-Driven Architecture", desc: "Bus de eventos Apache Kafka con productores y workers consumidores.", subcat: "Arquitectura de Software", tier: "specialized", featured: false },
  "07_user_flow": { name: "Software User Flow", desc: "Flujo lógico de interacción del sistema y ramas condicionales.", subcat: "Flujos de Software", tier: "specialized", featured: false },
  "08_sequence_diagram": { name: "Sequence Diagram", desc: "Mensajes sincrónicos y asíncronos en el tiempo sobre lifelines.", subcat: "Diagramas UML", tier: "specialized", featured: false },
  "09_ai_agent_architecture": { name: "AI Agent Architecture", desc: "Agente autónomo con memoria episódica, LLM Brain y Tool Calling.", subcat: "Inteligencia Artificial", tier: "core", featured: true },
  "10_rag_architecture": { name: "RAG Architecture", desc: "Pipeline RAG: Ingestión, Embeddings, Vector DB y Grounded LLM.", subcat: "Inteligencia Artificial", tier: "core", featured: true },
  "11_ai_workflow": { name: "AI Workflow (Human-in-the-Loop)", desc: "Flujo con carriles de automatización y supervisión humana.", subcat: "Inteligencia Artificial", tier: "specialized", featured: false },
  "12_prompt_engineering_framework": { name: "Prompt Engineering Framework", desc: "Marco estructurado para diseño de prompts empresariales.", subcat: "Inteligencia Artificial", tier: "specialized", featured: false },

  // Negocios & Producto (10)
  "01_business_model_canvas": { name: "Business Model Canvas", desc: "Los 9 bloques tradicionales de Osterwalder para modelos de negocio.", subcat: "Modelos de Negocio", tier: "core", featured: true },
  "02_lean_canvas": { name: "Lean Canvas", desc: "Framework de Ash Maurya enfocado en validación rápida de startups.", subcat: "Validación de Startups", tier: "core", featured: true },
  "03_swot_foda": { name: "SWOT / FODA", desc: "Matriz 2x2 de factores internos (F/D) y externos (O/A).", subcat: "Estrategia Corporativa", tier: "core", featured: true },
  "04_product_vision_board": { name: "Product Vision Board", desc: "Alineación de visión, público objetivo, necesidades y propuesta de valor.", subcat: "Gestión de Producto", tier: "specialized", featured: false },
  "05_product_roadmap": { name: "Product Roadmap (Now, Next, Later)", desc: "Horizontes estratégicos de producto con epics e hitos clave.", subcat: "Roadmaps & Estrategia", tier: "core", featured: true },
  "06_okr_planner": { name: "OKR Planner", desc: "Objetivos estratégicos y resultados clave cuantitativos medibles.", subcat: "Estrategia & Objetivos", tier: "core", featured: true },
  "07_decision_matrix": { name: "Decision Matrix", desc: "Ponderación multicriterio para toma de decisiones tecnológicas.", subcat: "Toma de Decisiones", tier: "specialized", featured: false },
  "08_eisenhower_matrix": { name: "Eisenhower Matrix", desc: "Matriz de urgencia vs importancia para priorización ejecutiva.", subcat: "Priorización", tier: "core", featured: true },
  "09_stakeholder_map": { name: "Stakeholder Map", desc: "Mapeo de interesados por nivel de poder e interés.", subcat: "Estrategia Corporativa", tier: "specialized", featured: false },
  "10_go_to_market_plan": { name: "Go-To-Market (GTM) Plan", desc: "Fases secuenciales de lanzamiento y penetración de mercado.", subcat: "Go-To-Market", tier: "specialized", featured: false },

  // Diseño & UX (10)
  "01_customer_journey_map": { name: "Customer Journey Map", desc: "Trayectoria del cliente, puntos de contacto y curva emocional.", subcat: "Experiencia de Usuario", tier: "core", featured: true },
  "02_user_journey_map": { name: "User Journey Map", desc: "Mapeo de interacción paso a paso para un flujo específico de usuario.", subcat: "Experiencia de Usuario", tier: "specialized", featured: false },
  "03_empathy_map": { name: "Empathy Map", desc: "Cuadrantes de empatía: qué dice, piensa, hace y siente el usuario.", subcat: "UX Research", tier: "core", featured: true },
  "04_persona_canvas": { name: "Persona Canvas", desc: "Arquetipo de usuario con metas, dolores, motivaciones y herramientas.", subcat: "UX Research", tier: "core", featured: true },
  "05_user_flow": { name: "UX User Flow", desc: "Diagrama de flujo de pantallas y bifurcaciones de experiencia de usuario.", subcat: "Arquitectura de Información", tier: "specialized", featured: false },
  "06_wireframe_board": { name: "Wireframe Board", desc: "Estructuras de baja fidelidad para maquetación y arquitectura de layouts.", subcat: "Wireframes & Layouts", tier: "specialized", featured: false },
  "07_design_critique": { name: "Design Critique", desc: "Sesión de feedback estructurado: aspectos positivos, dudas y mejoras.", subcat: "Design Thinking", tier: "specialized", featured: false },
  "08_ux_research_board": { name: "UX Research Board", desc: "Consolidación de hallazgos, insights y citas textuales de usuarios.", subcat: "UX Research", tier: "specialized", featured: false },
  "09_heuristic_evaluation": { name: "Heuristic Evaluation", desc: "Evaluación de las 10 heurísticas de usabilidad de Jakob Nielsen.", subcat: "Evaluación Heurística", tier: "specialized", featured: false },
  "10_design_sprint": { name: "Design Sprint (5 Días)", desc: "Tablero metodológico de 5 fases de Google Design Sprint.", subcat: "Design Thinking", tier: "specialized", featured: false },

  // Productividad & Ágil (10)
  "01_kanban_board": { name: "Kanban Board", desc: "Gestión visual de flujo de trabajo con 4 columnas y tarjetas de estado.", subcat: "Tableros Ágiles", tier: "core", featured: true },
  "02_weekly_planner": { name: "Weekly Planner", desc: "Planificación semanal de Lunes a Viernes con bloques de prioridades.", subcat: "Planificación Temporal", tier: "core", featured: true },
  "03_daily_planner": { name: "Daily Planner", desc: "Enfoque diario: Top 3 prioridades, timeblocking y notas de reflexión.", subcat: "Planificación Temporal", tier: "specialized", featured: false },
  "04_time_blocking": { name: "Time Blocking", desc: "Bloques temporales estructurados para Deep Work, reuniones y administración.", subcat: "Planificación Temporal", tier: "specialized", featured: false },
  "05_habit_tracker": { name: "Habit Tracker", desc: "Matriz mensual de seguimiento de hábitos y constancia diaria.", subcat: "Hábitos & Organización", tier: "specialized", featured: false },
  "06_meeting_notes": { name: "Meeting Notes", desc: "Registro estructurado de reuniones: objetivo, acuerdos y responsables.", subcat: "Reuniones & Minutas", tier: "specialized", featured: false },
  "07_action_items": { name: "Action Items Matrix", desc: "Matriz de seguimiento de tareas con deadlines, responsable y estado.", subcat: "Seguimiento de Tareas", tier: "specialized", featured: false },
  "08_sprint_retrospective": { name: "Sprint Retrospective", desc: "Dinámica de retrospectiva ágil: ¿Qué funcionó bien? y ¿Qué podemos mejorar?", subcat: "Metodologías Ágiles", tier: "core", featured: true },
  "09_team_alignment": { name: "Team Alignment Canvas", desc: "Canvas de acuerdos, roles, normas y misión compartida del equipo.", subcat: "Alineación de Equipo", tier: "specialized", featured: false },
  "10_priority_matrix": { name: "Priority Matrix (Impacto vs Esfuerzo)", desc: "Matriz de impacto vs esfuerzo para priorización estratégica de backlog.", subcat: "Priorización", tier: "specialized", featured: false },
};

// Expert Tier IDs
const EXPERT_IDS = new Set([
  // Estudio
  "10_comparison_study", "12_formula_sheet", "15_exam_matrix", "17_radar_tracker", "18_concept_dependency_map", "19_lab_report_canvas",
  // Ingeniería
  "05_spaghetti_diagram", "08_line_balancing", "09_bottleneck_analysis_toc", "10_oee_dashboard", "12_control_chart_spc", "15_process_capability_cp_cpk", "16_failure_tree_analysis_fta", "17_8d_problem_solving", "20_standard_work_combination_sheet",
  // Software & IA
  "10_security_architecture_zero_trust", "11_network_architecture_dmz", "14_cloud_architecture_multi_az", "19_kubernetes_architecture", "03_data_pipeline_streaming_batch", "05_data_lakehouse_medallion", "09_oauth_2_pkce_flow", "10_jwt_token_lifecycle", "12_multi_agent_system_hub", "14_vector_database_hnsw", "15_ai_evaluation_pipeline",
  // Negocios & Producto
  "08_strategy_to_execution_map", "11_business_ecosystem_map", "13_scenario_planning", "15_business_capability_architecture", "14_product_metrics_tree", "15_north_star_metric_framework",
  // Diseño & UX
  "02_service_blueprint", "07_usability_testing_board", "15_user_mental_model_vs_system", "07_lotus_blossom_diagram", "10_idea_evaluation_canvas_venn",
  // Productividad
  "01_agile_release_train_art", "04_quarterly_release_planning", "07_critical_path_dependency_map", "08_project_status_rag_dashboard", "09_raid_log", "09_architecture_decision_record_adr_log"
]);

// Core / Featured Tier IDs (Explicitly defined ~36 core templates)
const CORE_FEATURED_IDS = new Set([
  // Estudio
  "01_study_notes", "02_mind_map", "03_concept_map", "05_exam_prep", "08_cornell_notes", "10_learning_roadmap", "01_study_planner",
  // Ingeniería
  "01_sipoc", "02_value_stream_mapping", "03_process_map", "04_fishbone_ishikawa", "05_fmea", "01_value_added_flow_analysis", "18_a3_report",
  // Software & IA
  "01_system_design", "02_software_architecture", "03_api_architecture", "04_database_schema", "05_microservices_architecture", "09_ai_agent_architecture", "10_rag_architecture", "01_c4_system_context", "02_c4_container", "06_class_diagram",
  // Negocios & Producto
  "01_business_model_canvas", "02_lean_canvas", "03_swot_foda", "05_product_roadmap", "06_okr_planner", "01_pestel_analysis", "02_prd_1_pager", "04_user_story_map",
  // Diseño & UX
  "01_customer_journey_map", "02_service_blueprint", "03_empathy_map", "04_persona_canvas", "01_brainstorming_board",
  // Productividad & Ágil
  "01_kanban_board", "02_weekly_planner", "08_eisenhower_matrix", "08_sprint_retrospective", "06_gantt_chart_vectorial", "10_raci_matrix"
]);

const SUBCATEGORY_EXP_MAP = {
  "01_estudio_educacion": "Estudio & Educación Avanzada",
  "02_ingenieria_procesos": "Ingeniería Industrial & Procesos",
  "03_software_architecture": "Arquitectura de Software & Cloud",
  "04_data_apis_ai": "Datos, APIs & IA",
  "05_negocios_estrategia": "Estrategia & Modelos de Negocio",
  "06_producto_pm": "Gestión de Producto & Métricas",
  "07_ux_research": "UX Research & Síntesis",
  "08_design_thinking_ideation": "Design Thinking & Ideación",
  "09_agile_proyectos": "Metodologías Ágiles & Proyectos",
  "10_productividad_personal": "Productividad Personal & Ejecutiva"
};

const CATEGORY_META = {
  estudio: {
    slug: "estudio",
    name: "Estudio",
    icon: "estudio",
    description: "Apuntes estructurados, mapas conceptuales, fichas Cornell, preparación de exámenes y tesis",
    tsFileName: "estudio.ts",
    exportName: "ESTUDIO_TEMPLATES",
  },
  ingenieria: {
    slug: "ingenieria",
    name: "Ingeniería",
    icon: "ingenieria",
    description: "SIPOC, VSM, Ishikawa 6M, FMEA, informe A3, SPC, árboles de fallos (FTA) y Kaizen",
    tsFileName: "ingenieria.ts",
    exportName: "INGENIERIA_TEMPLATES",
  },
  software_ia: {
    slug: "software_ia",
    name: "Software & IA",
    icon: "software_ia",
    description: "System Design, arquitecturas C4, microservicios, diagramas ER, RAG, agentes IA y Kubernetes",
    tsFileName: "software_ia.ts",
    exportName: "SOFTWARE_IA_TEMPLATES",
  },
  negocios: {
    slug: "negocios",
    name: "Negocios & Producto",
    icon: "negocios",
    description: "Lean Canvas, PESTEL, Porter, Roadmaps Now-Next-Later, User Story Mapping y PRDs",
    tsFileName: "negocios.ts",
    exportName: "NEGOCIOS_TEMPLATES",
  },
  diseno_ux: {
    slug: "diseno_ux",
    name: "Diseño & UX",
    icon: "diseno_ux",
    description: "Customer Journey, Service Blueprints, mapas de empatía, personas, flujos y Design Sprints",
    tsFileName: "diseno_ux.ts",
    exportName: "DISENO_UX_TEMPLATES",
  },
  productividad: {
    slug: "productividad",
    name: "Productividad",
    icon: "productividad",
    description: "Tableros Kanban, Release Trains (ART), Gantt, retrospectivas ágiles, matrices y minutas",
    tsFileName: "productividad.ts",
    exportName: "PRODUCTIVIDAD_TEMPLATES",
  },
};

const featuredIds = [];
let totalTemplatesProcessed = 0;

console.log("🚀 Sincronizando catálogo universal de 212 plantillas...");

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

    // Determine metadata
    let name = "";
    let desc = "";
    let subcategory = "";
    let tier = "specialized";
    let isFeatured = false;
    let complexity = "medium";
    let tags = [];

    if (CORE_TITLES[fileBase]) {
      const c = CORE_TITLES[fileBase];
      name = c.name;
      desc = c.desc;
      subcategory = c.subcat || "Fundamentos";
      tier = c.tier || "specialized";
      isFeatured = !!c.featured;
    } else if (extMetaMap.has(fileBase)) {
      const ext = extMetaMap.get(fileBase);
      name = ext.title || fileBase.replace(/^\d+_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      desc = `Plantilla técnica paramétrica de ${name} con arquitectura de precisión y ruteo a 90°.`;
      subcategory = SUBCATEGORY_EXP_MAP[ext.category] || "Especializado";
      complexity = ext.complexity || "medium";
      tags = ext.primary_structures || [];
      if (EXPERT_IDS.has(fileBase)) {
        tier = "expert";
      } else if (CORE_FEATURED_IDS.has(fileBase)) {
        tier = "core";
        isFeatured = true;
      } else {
        tier = "specialized";
      }
    } else {
      name = fileBase.replace(/^\d+_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      desc = "Plantilla profesional estructurada para tu lienzo de trabajo.";
      subcategory = "General";
      tier = EXPERT_IDS.has(fileBase) ? "expert" : CORE_FEATURED_IDS.has(fileBase) ? "core" : "specialized";
    }

    if (CORE_FEATURED_IDS.has(fileBase)) {
      tier = "core";
      isFeatured = true;
    }

    if (isFeatured && !featuredIds.includes(fileBase)) {
      featuredIds.push(fileBase);
    }

    const templateObj = {
      id: fileBase,
      name,
      description: desc,
      icon: catInfo.icon,
      category: catInfo.name,
      categorySlug: catInfo.slug,
      subcategory,
      tier,
      complexity,
      tags,
      isFeatured,
      filePath: `/templates/${catKey}/${fileName}`,
      thumbnailUrl: `/templates/${catKey}/${fileBase}.svg`,
      thumbnailSvg: svgRaw.trim(),
      elements: excalData.elements || [],
      appState: excalData.appState || { viewBackgroundColor: "#F8FAFC" },
    };

    templateObjects.push(templateObj);
    totalTemplatesProcessed++;
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
      subcategory: t.subcategory,
      tier: t.tier,
      complexity: t.complexity,
      tags: t.tags,
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
console.log(`  ✓ Generado featured.ts (${featuredIds.length} IDs destacados)`);

// Write types.ts
const typesContent = `export type TemplateCategorySlug =
  | "todos"
  | "estudio"
  | "ingenieria"
  | "software_ia"
  | "negocios"
  | "diseno_ux"
  | "productividad";

export type TemplateTier = "core" | "specialized" | "expert";

export interface TemplateCategoryInfo {
  slug: TemplateCategorySlug;
  name: string;
  icon: string;
  description: string;
  count?: number;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  categorySlug: TemplateCategorySlug;
  subcategory?: string;
  tier: TemplateTier;
  complexity?: "low" | "medium" | "high" | "expert" | "extreme";
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
console.log("  ✓ Actualizado types.ts");

// Write index.ts
const indexContent = `import { Template, TemplateCategoryInfo, TemplateCategorySlug, TemplateTier } from "./types";
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
    icon: "todos",
    description: "Colección universal completa de 212 plantillas vectoriales profesionales",
    count: 212,
  },
  {
    slug: "estudio",
    name: "Estudio",
    icon: "estudio",
    description: "Apuntes de clase, mapas conceptuales, fichas Cornell, preparación de exámenes y tesis",
    count: 30,
  },
  {
    slug: "ingenieria",
    name: "Ingeniería",
    icon: "ingenieria",
    description: "SIPOC, VSM, Ishikawa 6M, FMEA, informe A3, SPC, árboles de fallos (FTA) y Kaizen",
    count: 30,
  },
  {
    slug: "software_ia",
    name: "Software & IA",
    icon: "software_ia",
    description: "System Design, arquitecturas C4, microservicios, diagramas ER, RAG, agentes IA y Kubernetes",
    count: 47,
  },
  {
    slug: "negocios",
    name: "Negocios & Producto",
    icon: "negocios",
    description: "Lean Canvas, PESTEL, Porter, Roadmaps Now-Next-Later, User Story Mapping y PRDs",
    count: 40,
  },
  {
    slug: "diseno_ux",
    name: "Diseño & UX",
    icon: "diseno_ux",
    description: "Customer Journey, Service Blueprints, mapas de empatía, personas, flujos y Design Sprints",
    count: 35,
  },
  {
    slug: "productividad",
    name: "Productividad",
    icon: "productividad",
    description: "Tableros Kanban, Release Trains (ART), Gantt, retrospectivas ágiles, matrices y minutas",
    count: 30,
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
  return TEMPLATES.filter((t) => featuredSet.has(t.id) || t.isFeatured || t.tier === "core");
};

export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find((t) => t.id === id);
};

export const getTemplatesByCategory = (slug: TemplateCategorySlug): Template[] => {
  if (slug === "todos") return TEMPLATES;
  return TEMPLATES.filter((t) => t.categorySlug === slug);
};

export const getTemplatesByTier = (tier: TemplateTier, categorySlug: TemplateCategorySlug = "todos"): Template[] => {
  const list = getTemplatesByCategory(categorySlug);
  return list.filter((t) => t.tier === tier);
};

export const searchTemplates = (
  query: string,
  categorySlug: TemplateCategorySlug = "todos",
  tierFilter?: TemplateTier | "all",
): Template[] => {
  const cleanQuery = query.toLowerCase().trim();
  let list = getTemplatesByCategory(categorySlug);

  if (tierFilter && tierFilter !== "all") {
    list = list.filter((t) => t.tier === tierFilter);
  }

  if (!cleanQuery) return list;

  return list.filter(
    (tmpl) =>
      tmpl.name.toLowerCase().includes(cleanQuery) ||
      tmpl.description.toLowerCase().includes(cleanQuery) ||
      tmpl.category.toLowerCase().includes(cleanQuery) ||
      (tmpl.subcategory && tmpl.subcategory.toLowerCase().includes(cleanQuery)) ||
      (tmpl.tags && tmpl.tags.some((tag) => tag.toLowerCase().includes(cleanQuery))),
  );
};
`;
fs.writeFileSync(path.join(DATA_TEMPLATES_DIR, "index.ts"), indexContent, "utf8");
console.log("  ✓ Actualizado index.ts");

console.log(`\n🎉 ¡Sincronización completa con éxito! Total de plantillas compiladas: ${totalTemplatesProcessed}`);
