import "server-only";
import { getAllSites, getConfig, getAllShortcuts, getCategoryOrder, getDefaultCategory } from "@/lib/db";
import type { SiteData, ShortcutConfig } from "@/lib/types";
import type { SiteConfig } from "@/lib/db";

export function getSites(): { sites: SiteData[]; categories: string[]; config: SiteConfig; shortcuts: ShortcutConfig[]; defaultCategory: string | null } {
  const rows = getAllSites();
  const config = getConfig();

  const sites: SiteData[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    desc: r.desc,
    icon: r.icon,
    icon_url: r.icon_url,
    category: r.category,
    url: { internal: r.url_internal, external: r.url_external },
    sort_order: r.sort_order,
    created_at: r.created_at,
  }));

  const categorySet = new Set(sites.map((s) => s.category));
  const savedOrder = getCategoryOrder();
  const defaultCategory = getDefaultCategory();

  const sortedCategories = Array.from(categorySet).sort((a, b) => {
    const aIdx = savedOrder.indexOf(a);
    const bIdx = savedOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const shortcuts = getAllShortcuts().map((s) => ({ key: s.key, site_id: s.site_id }));

  return { sites, categories: sortedCategories, config, shortcuts, defaultCategory };
}
