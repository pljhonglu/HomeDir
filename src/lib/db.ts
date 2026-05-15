import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { createHash, randomBytes } from "crypto";

interface SiteRow {
  id: string;
  name: string;
  desc: string;
  icon: string; // lucide icon name, e.g. "HardDrive"
  icon_url: string; // favicon filename in data/icons/
  category: string;
  url_internal: string;
  url_external: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SiteInput {
  id?: string;
  name: string;
  desc: string;
  icon: string;
  icon_url?: string;
  category: string;
  url_internal: string;
  url_external: string;
  sort_order?: number;
}

const DB_PATH = path.join(process.cwd(), "data", "sites.db");

let _db: InstanceType<typeof Database> | null = null;

function getDb() {
  if (_db) return _db;

  // 确保 data 目录存在
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // 创建表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'Globe',
      category TEXT NOT NULL DEFAULT '未分类',
      url_internal TEXT NOT NULL DEFAULT '',
      url_external TEXT NOT NULL DEFAULT '',
      icon_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 配置表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  // 热键表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS shortcuts (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      site_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
    )
  `);

  // API Key 表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      prefix TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT
    )
  `);

  // 自定义变量表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return _db;
}

// 热键操作
export interface ShortcutRow {
  id: string;
  key: string;
  site_id: string;
  created_at: string;
}

export function getAllShortcuts(): ShortcutRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM shortcuts ORDER BY created_at").all() as ShortcutRow[];
}

export function createShortcut(key: string, siteId: string): ShortcutRow {
  const db = getDb();
  const id = genId();
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  db.prepare("INSERT INTO shortcuts (id, key, site_id, created_at) VALUES (?, ?, ?, ?)").run(id, key.toUpperCase(), siteId, now);
  return db.prepare("SELECT * FROM shortcuts WHERE id = ?").get(id) as ShortcutRow;
}

export function deleteShortcut(id: string): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM shortcuts WHERE id = ?").run(id).changes > 0;
}

// 配置操作
export interface SiteConfig {
  site_name: string;
  site_description: string;
  footer_text: string;
  admin_password: string;
  admin_session: string;
}

const defaultConfig: SiteConfig = {
  site_name: "HomeDir",
  site_description: "快速访问内外网服务的导航中心",
  footer_text: "© 2026 Lxcloud · Powered by <a href=\"https://github.com/52Lxcloud/HomeDir\">HomeDir</a>",
  admin_password: "",
  admin_session: "",
};

export function isAuthDisabled(): boolean {
  return process.env.DISABLE_AUTH === "true";
}

export function getConfig(): SiteConfig {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM config").all() as { key: string; value: string }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    site_name: map.get("site_name") || defaultConfig.site_name,
    site_description: map.get("site_description") || defaultConfig.site_description,
    footer_text: map.get("footer_text") || defaultConfig.footer_text,
    admin_password: map.get("admin_password") || "",
    admin_session: map.get("admin_session") || "",
  };
}

export function updateConfig(updates: Record<string, string>): void {
  const db = getDb();
  const stmt = db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)");
  const run = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) stmt.run(k, v);
  });
  run(Object.entries(updates) as [string, string][]);
}

// 生成短 ID
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getAllSites(): SiteRow[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM sites ORDER BY category, sort_order, name").all() as SiteRow[];

  return rows;
}


export function createSite(input: SiteInput): SiteRow {
  const db = getDb();
  const id = input.id || genId();
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');

  db.prepare(`
    INSERT INTO sites (id, name, desc, icon, icon_url, category, url_internal, url_external, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.desc,
    input.icon,
    input.icon_url || '',
    input.category,
    input.url_internal,
    input.url_external,
    input.sort_order ?? 0,
    now,
    now
  );

  const row = db.prepare("SELECT * FROM sites WHERE id = ?").get(id) as SiteRow;

  return row;
}

export function updateSite(id: string, input: Partial<SiteInput>): SiteRow | null {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM sites WHERE id = ?").get(id) as SiteRow | undefined;
  if (!existing) {
    return null;
  }

  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  db.prepare(`
    UPDATE sites SET
      name = ?, desc = ?, icon = ?, icon_url = ?, category = ?,
      url_internal = ?, url_external = ?,
      sort_order = ?, updated_at = ?
    WHERE id = ?
  `).run(
    input.name ?? existing.name,
    input.desc ?? existing.desc,
    input.icon ?? existing.icon,
    input.icon_url ?? existing.icon_url,
    input.category ?? existing.category,
    input.url_internal ?? existing.url_internal,
    input.url_external ?? existing.url_external,
    input.sort_order ?? existing.sort_order,
    now,
    id
  );

  const row = db.prepare("SELECT * FROM sites WHERE id = ?").get(id) as SiteRow;

  return row;
}

export function deleteSite(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM sites WHERE id = ?").run(id);
  return result.changes > 0;
}

export function updateSiteSortOrders(updates: { id: string; sort_order: number }[]): void {
  const db = getDb();
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  const stmt = db.prepare("UPDATE sites SET sort_order = ?, updated_at = ? WHERE id = ?");
  const run = db.transaction((items: { id: string; sort_order: number }[]) => {
    for (const item of items) {
      stmt.run(item.sort_order, now, item.id);
    }
  });
  run(updates);
}

// 分类操作
export function renameCategory(oldName: string, newName: string): number {
  const db = getDb();
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  const result = db.prepare("UPDATE sites SET category = ?, updated_at = ? WHERE category = ?").run(newName, now, oldName);
  return result.changes;
}

export function deleteCategory(name: string): number {
  const db = getDb();
  const result = db.prepare("DELETE FROM sites WHERE category = ?").run(name);
  return result.changes;
}

export function getCategoryOrder(): string[] {
  const db = getDb();
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get("category_order") as { value: string } | undefined;
  if (!row || !row.value) return [];
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}

export function setCategoryOrder(order: string[]): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run("category_order", JSON.stringify(order));
}

export function getDefaultCategory(): string | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get("default_category") as { value: string } | undefined;
  return row?.value || null;
}

export function setDefaultCategory(category: string | null): void {
  const db = getDb();
  if (category) {
    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run("default_category", category);
  } else {
    db.prepare("DELETE FROM config WHERE key = ?").run("default_category");
  }
}

// API Key 操作
export interface ApiKeyRow {
  id: string;
  name: string;
  key_hash: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  key: string;
  prefix: string;
  created_at: string;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function createApiKey(name: string): ApiKeyCreated {
  const db = getDb();
  const id = genId();
  const rawKey = `hd_${randomBytes(24).toString("hex")}`;
  const keyHash = hashKey(rawKey);
  const prefix = rawKey.slice(0, 7);
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');

  db.prepare("INSERT INTO api_keys (id, name, key_hash, prefix, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, name.trim(), keyHash, prefix, now);

  return { id, name: name.trim(), key: rawKey, prefix, created_at: now };
}

export function listApiKeys(): Omit<ApiKeyRow, "key_hash">[] {
  const db = getDb();
  return db.prepare("SELECT id, name, prefix, created_at, last_used_at FROM api_keys ORDER BY created_at DESC")
    .all() as Omit<ApiKeyRow, "key_hash">[];
}

export function deleteApiKey(id: string): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM api_keys WHERE id = ?").run(id).changes > 0;
}

export function verifyApiKey(rawKey: string): boolean {
  const db = getDb();
  const keyHash = hashKey(rawKey);
  const row = db.prepare("SELECT id FROM api_keys WHERE key_hash = ?").get(keyHash) as { id: string } | undefined;
  if (!row) return false;
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").run(now, row.id);
  return true;
}

// 自定义变量操作
export interface VariableRow {
  id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export function getAllVariables(): VariableRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM variables ORDER BY name").all() as VariableRow[];
}

export function createVariable(name: string, value: string): VariableRow {
  const db = getDb();
  const id = genId();
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  db.prepare("INSERT INTO variables (id, name, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, name.trim(), value, now, now);
  return db.prepare("SELECT * FROM variables WHERE id = ?").get(id) as VariableRow;
}

export function updateVariable(id: string, updates: { name?: string; value?: string }): VariableRow | null {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM variables WHERE id = ?").get(id) as VariableRow | undefined;
  if (!existing) return null;

  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  const newName = (updates.name ?? existing.name).trim();
  const newValue = updates.value ?? existing.value;

  db.prepare("UPDATE variables SET name = ?, value = ?, updated_at = ? WHERE id = ?")
    .run(newName, newValue, now, id);
  return db.prepare("SELECT * FROM variables WHERE id = ?").get(id) as VariableRow;
}

export function updateVariableByName(name: string, value: string): VariableRow | null {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM variables WHERE name = ?").get(name) as VariableRow | undefined;
  if (!existing) return null;

  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T');
  db.prepare("UPDATE variables SET value = ?, updated_at = ? WHERE name = ?")
    .run(value, now, name);
  return db.prepare("SELECT * FROM variables WHERE name = ?").get(name) as VariableRow;
}

export function deleteVariable(id: string): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM variables WHERE id = ?").run(id).changes > 0;
}

