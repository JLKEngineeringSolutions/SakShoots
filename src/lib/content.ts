import { supabase } from '@/lib/supabase';

export type Category = {
  id: string;
  slug: string;
  name: string;
  lens: string;
  blurb: string;
  cover_url: string;
  sort_order: number;
  is_visible: boolean;
};

export type Project = {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  place: string;
  brief: string;
  lens: string;
  year: string;
  sort_order: number;
  is_visible: boolean;
  is_featured: boolean;
  featured_tag: string;
};

export type ProjectImage = {
  id: string;
  project_id: string;
  url: string;
  sort_order: number;
  equipment_id: string | null;
};

export type Equipment = {
  id: string;
  kind: 'camera' | 'lens' | 'support';
  name: string;
  subtitle: string;
  usage: string;
  image_url: string;
  specs: string[];
  sort_order: number;
  is_visible: boolean;
};

export type ServiceTier = {
  id: string;
  title: string;
  lens: string;
  price: string;
  badge: string;
  summary: string;
  features: string[];
  is_featured: boolean;
  sort_order: number;
};

export type TextItem = { title: string; text: string };

export const DEFAULT_CONTENT = {
  brand_logo: '/283150b1-3d59-454d-8f5e-c9239aee950c_rwc_20x0x1413x356x4096.png',
  home_hero_headline: '',
  home_hero_intro: '',
  home_hero_image: '',
  home_clients: [] as string[],
  home_shoot_heading: '',
  home_frames_heading: '',
  home_approach_image: '',
  home_approach_quote: '',
  home_approach_text: '',
  about_image: '',
  about_image_caption: '',
  about_headline: '',
  about_body: [] as string[],
  about_kit: [] as TextItem[],
  services_headline: '',
  services_intro: '',
  services_steps: [] as TextItem[],
  contact_headline: '',
  contact_intro: '',
  contact_thanks: '',
  cta_eyebrow: '',
  cta_headline: '',
  footer_credit: '',
  link_email: '',
  link_instagram: '',
  link_youtube: '',
  link_prints: '',
  link_journal: '',
  kit_headline: '',
  kit_intro: '',
  kit_camera_heading: '',
  kit_lenses_heading: '',
  kit_support_heading: '',
  kit_cta_eyebrow: '',
  kit_cta_headline: '',
  home_kit_heading: '',
  home_kit_blurb: '',
};

export type SiteContent = typeof DEFAULT_CONTENT;
export type ContentKey = keyof SiteContent;

export type PortfolioProject = Project & { images: string[] };
export type PortfolioCategory = Category & { n: string; projects: PortfolioProject[] };
export type KitItem = Equipment & { photos: string[] };

export type SiteData = {
  content: SiteContent;
  categories: PortfolioCategory[];
  featured: (PortfolioProject & { catSlug: string })[];
  tiers: ServiceTier[];
  equipment: KitItem[];
};

export function normalizeContent(rows: { key: string; value: unknown }[]): SiteContent {
  const content: SiteContent = { ...DEFAULT_CONTENT };
  const target = content as Record<string, unknown>;
  for (const row of rows) {
    if (!(row.key in DEFAULT_CONTENT)) continue;
    const fallback = DEFAULT_CONTENT[row.key as ContentKey];
    const ok = Array.isArray(fallback) ? Array.isArray(row.value) : typeof row.value === 'string';
    if (ok) target[row.key] = row.value;
  }
  return content;
}

async function must<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? ([] as unknown as T);
}

export async function fetchSiteData(): Promise<SiteData> {
  const [contentRows, cats, projects, images, tiers, equipment] = await Promise.all([
    must<{ key: string; value: unknown }[]>(supabase.from('site_content').select('key, value')),
    must<Category[]>(supabase.from('categories').select('*').eq('is_visible', true).order('sort_order')),
    must<Project[]>(supabase.from('projects').select('*').eq('is_visible', true).order('sort_order')),
    must<ProjectImage[]>(supabase.from('project_images').select('*').order('sort_order')),
    must<ServiceTier[]>(supabase.from('service_tiers').select('*').order('sort_order')),
    must<Equipment[]>(supabase.from('equipment').select('*').eq('is_visible', true).order('sort_order')),
  ]);

  const visibleProjectIds = new Set(projects.map((p) => p.id));
  const imagesByProject = new Map<string, string[]>();
  const photosByEquipment = new Map<string, string[]>();
  for (const img of images) {
    const list = imagesByProject.get(img.project_id) ?? [];
    list.push(img.url);
    imagesByProject.set(img.project_id, list);
    if (img.equipment_id && visibleProjectIds.has(img.project_id)) {
      const tagged = photosByEquipment.get(img.equipment_id) ?? [];
      tagged.push(img.url);
      photosByEquipment.set(img.equipment_id, tagged);
    }
  }

  const kit: KitItem[] = equipment.map((e) => ({ ...e, photos: photosByEquipment.get(e.id) ?? [] }));

  const categories: PortfolioCategory[] = cats.map((c, i) => ({
    ...c,
    n: String(i + 1).padStart(2, '0'),
    projects: projects
      .filter((p) => p.category_id === c.id)
      .map((p) => ({ ...p, images: imagesByProject.get(p.id) ?? [] })),
  }));

  const featured = categories.flatMap((c) =>
    c.projects.filter((p) => p.is_featured && p.images.length > 0).map((p) => ({ ...p, catSlug: c.slug })),
  );

  return { content: normalizeContent(contentRows), categories, featured, tiers, equipment: kit };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
