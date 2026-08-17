import { Template, TemplateCategoryInfo, TemplateCategorySlug } from "./types";
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
    description: "Colección curada completa de 62 plantillas vectoriales profesionales",
  },
  {
    slug: "estudio",
    name: "Estudio",
    icon: "estudio",
    description: "Apuntes de clase, mapas conceptuales, fichas de lectura y preparación de parciales",
  },
  {
    slug: "ingenieria",
    name: "Ingeniería",
    icon: "ingenieria",
    description: "SIPOC, VSM, Ishikawa, FMEA, análisis de Pareto y matrices de riesgo",
  },
  {
    slug: "software_ia",
    name: "Software & IA",
    icon: "software_ia",
    description: "System design, microservicios, bases de datos relacionales, arquitecturas de agentes IA y RAG",
  },
  {
    slug: "negocios",
    name: "Negocios & Producto",
    icon: "negocios",
    description: "Lean Canvas, FODA, Product Roadmaps, OKRs y matrices estratégicas",
  },
  {
    slug: "diseno_ux",
    name: "Diseño & UX",
    icon: "diseno_ux",
    description: "Customer Journey, mapas de empatía, personas, flujos de navegación y Design Sprints",
  },
  {
    slug: "productividad",
    name: "Productividad",
    icon: "productividad",
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
