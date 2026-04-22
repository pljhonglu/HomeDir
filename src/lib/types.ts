export interface SiteData {
  id: string;
  name: string;
  desc: string;
  icon: string;
  icon_url: string;
  category: string;
  url: { internal: string; external: string };
  sort_order: number;
  created_at: string;
}

export interface ShortcutConfig {
  key: string;
  site_id: string;
}
