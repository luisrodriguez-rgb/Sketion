export type TemplateCategorySlug =
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
