import { Template, TemplateCategoryInfo, TemplateCategorySlug, TemplateTier } from "./types";
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
