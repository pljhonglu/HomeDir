"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import {
  isAuthDisabled,
  createSite,
  updateSite,
  deleteSite,
  renameCategory,
  deleteCategory,
  updateConfig,
  createShortcut,
  deleteShortcut,
  getAllShortcuts,
  getCategoryOrder,
  setCategoryOrder,
  getDefaultCategory,
  setDefaultCategory,
  updateSiteSortOrders,
  createApiKey,
  listApiKeys,
  deleteApiKey,
  getAllVariables,
  createVariable,
  updateVariable,
  deleteVariable,
} from "@/lib/db";
import type { SiteConfig } from "@/lib/db";
import { saveIcon } from "@/lib/icons-fs";

interface SiteFormInput {
  name: string;
  desc: string;
  icon: string;
  icon_url?: string;
  category: string;
  url_internal: string;
  url_external: string;
  sort_order: number;
}

type ActionResult = { success: true } | { success: false; error: string };

function validate(data: SiteFormInput): string | null {
  if (!data.name || data.name.trim().length === 0) return "名称不能为空";
  if (data.name.length > 100) return "名称不能超过 100 个字符";
  if (!data.category || data.category.trim().length === 0) return "分类不能为空";
  if (!data.url_internal && !data.url_external) return "至少填写一个地址";
  return null;
}

async function requireAuth(): Promise<ActionResult | null> {
  if (!isAuthDisabled() && !(await isAuthenticated())) return { success: false, error: "未登录" };
  return null;
}

export async function createSiteAction(formData: SiteFormInput): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  const error = validate(formData);
  if (error) return { success: false, error };

  try {
    createSite(formData);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("创建站点失败:", e);
    return { success: false, error: "创建站点失败" };
  }
}

export async function updateSiteAction(id: string, formData: SiteFormInput): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!id) return { success: false, error: "站点 ID 不能为空" };

  const error = validate(formData);
  if (error) return { success: false, error };

  try {
    const result = updateSite(id, formData);
    if (!result) return { success: false, error: "站点不存在" };
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("更新站点失败:", e);
    return { success: false, error: "更新站点失败" };
  }
}

export async function deleteSiteAction(id: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!id) return { success: false, error: "站点 ID 不能为空" };

  try {
    const ok = deleteSite(id);
    if (!ok) return { success: false, error: "站点不存在" };
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("删除站点失败:", e);
    return { success: false, error: "删除站点失败" };
  }
}

// 分类操作
export async function renameCategoryAction(oldName: string, newName: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!oldName || !newName.trim()) return { success: false, error: "分类名称不能为空" };
  if (oldName === newName) return { success: true };

  try {
    renameCategory(oldName, newName.trim());
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("重命名分类失败:", e);
    return { success: false, error: "重命名分类失败" };
  }
}

export async function deleteCategoryAction(name: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!name) return { success: false, error: "分类名称不能为空" };

  try {
    deleteCategory(name);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("删除分类失败:", e);
    return { success: false, error: "删除分类失败" };
  }
}

// 抓取 favicon 并保存到本地文件
export async function fetchFaviconAction(url: string): Promise<{ success: true; data: string } | { success: false; error: string }> {
  if (!isAuthDisabled() && !(await isAuthenticated())) return { success: false, error: "未登录" };
  try {
    const { origin, hostname, protocol } = new URL(url);
    const tryFetch = async (u: string): Promise<Buffer | null> => {
      try {
        const res = await fetch(u, { signal: AbortSignal.timeout(5000), redirect: "follow" });
        if (!res.ok) return null;
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("image") && !ct.includes("icon") && !ct.includes("octet-stream")) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 10) return null;
        return buf;
      } catch { return null; }
    };

    let iconBuf: Buffer | null = null;

    // 1) 从 HTML 解析 <link rel="icon"> href
    try {
      const html = await fetch(origin, { signal: AbortSignal.timeout(5000), redirect: "follow" }).then(r => r.text());
      const m = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)
        || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*icon[^"']*["']/i);
      if (m) {
        let href = m[1];
        if (href.startsWith("//")) href = `${protocol}${href}`;
        else if (href.startsWith("/")) href = `${origin}${href}`;
        else if (!href.startsWith("http")) href = `${origin}/${href}`;
        iconBuf = await tryFetch(href);
      }
    } catch {}

    // 2) 常见路径
    if (!iconBuf) {
      for (const p of ["/favicon.ico", "/apple-touch-icon.png"]) {
        iconBuf = await tryFetch(`${origin}${p}`);
        if (iconBuf) break;
      }
    }

    // 3) Google API 兜底（外网）
    if (!iconBuf && !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|localhost|127\.)/.test(hostname)) {
      iconBuf = await tryFetch(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`);
    }

    if (!iconBuf) return { success: false, error: "未找到图标" };

    // 保存到 data/icons/
    const filename = saveIcon(iconBuf);
    return { success: true, data: filename };
  } catch {
    return { success: false, error: "URL 格式无效" };
  }
}

// 热键操作
export async function createShortcutAction(key: string, siteId: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!key.trim() || key.trim().length !== 1) return { success: false, error: "热键必须是单个字母" };
  if (!/^[a-zA-Z0-9]$/.test(key.trim())) return { success: false, error: "热键必须是字母或数字" };
  if (key.trim().toUpperCase() === "K") return { success: false, error: "⌘K 为内置搜索热键，不可使用" };
  if (!siteId) return { success: false, error: "请选择站点" };
  // 检查重复
  if (getAllShortcuts().some((s) => s.key.toUpperCase() === key.trim().toUpperCase())) return { success: false, error: "该热键已被占用" };
  try {
    createShortcut(key.trim(), siteId);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("创建热键失败:", e);
    return { success: false, error: "创建热键失败" };
  }
}

export async function deleteShortcutAction(id: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!id) return { success: false, error: "ID 不能为空" };
  try {
    deleteShortcut(id);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("删除热键失败:", e);
    return { success: false, error: "删除热键失败" };
  }
}

// 配置操作
export async function updateConfigAction(config: Partial<SiteConfig>): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (config.site_name !== undefined && !config.site_name.trim()) return { success: false, error: "站点名称不能为空" };
  if (config.site_description !== undefined && !config.site_description.trim()) return { success: false, error: "站点描述不能为空" };
  try {
    updateConfig(config);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("保存配置失败:", e);
    return { success: false, error: "保存配置失败" };
  }
}

// 分类排序和默认分类操作
export async function setCategoryOrderAction(order: string[]): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    setCategoryOrder(order);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("保存分类排序失败:", e);
    return { success: false, error: "保存分类排序失败" };
  }
}

export async function setDefaultCategoryAction(category: string | null): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    setDefaultCategory(category);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("保存默认分类失败:", e);
    return { success: false, error: "保存默认分类失败" };
  }
}

export async function updateSiteSortOrdersAction(updates: { id: string; sort_order: number }[]): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    updateSiteSortOrders(updates);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("保存站点排序失败:", e);
    return { success: false, error: "保存站点排序失败" };
  }
}

// API Key 操作
export async function createApiKeyAction(name: string): Promise<{ success: true; data: { id: string; name: string; key: string; prefix: string; created_at: string } } | { success: false; error: string }> {
  if (!isAuthDisabled() && !(await isAuthenticated())) return { success: false, error: "未登录" };
  if (!name || !name.trim()) return { success: false, error: "名称不能为空" };
  if (name.trim().length > 50) return { success: false, error: "名称不能超过 50 个字符" };
  try {
    const result = createApiKey(name);
    revalidatePath("/dash");
    return { success: true, data: result };
  } catch (e) {
    console.error("创建 API Key 失败:", e);
    return { success: false, error: "创建 API Key 失败" };
  }
}

export async function listApiKeysAction(): Promise<{ success: true; data: { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null }[] } | { success: false; error: string }> {
  if (!isAuthDisabled() && !(await isAuthenticated())) return { success: false, error: "未登录" };
  try {
    const keys = listApiKeys();
    return { success: true, data: keys };
  } catch (e) {
    console.error("获取 API Key 列表失败:", e);
    return { success: false, error: "获取 API Key 列表失败" };
  }
}

export async function deleteApiKeyAction(id: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!id) return { success: false, error: "ID 不能为空" };
  try {
    const ok = deleteApiKey(id);
    if (!ok) return { success: false, error: "API Key 不存在" };
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("删除 API Key 失败:", e);
    return { success: false, error: "删除 API Key 失败" };
  }
}

// 自定义变量操作
export async function createVariableAction(name: string, value: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!name || !name.trim()) return { success: false, error: "变量名不能为空" };
  if (name.trim().length > 50) return { success: false, error: "变量名不能超过 50 个字符" };
  if (!/^[A-Za-z_]\w*$/.test(name.trim())) return { success: false, error: "变量名只能包含字母、数字和下划线，且必须以字母或下划线开头" };
  try {
    const existing = getAllVariables().find((v) => v.name === name.trim());
    if (existing) return { success: false, error: "变量名已存在" };
    createVariable(name.trim(), value);
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("创建变量失败:", e);
    return { success: false, error: "创建变量失败" };
  }
}

export async function updateVariableAction(id: string, name: string, value: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!id) return { success: false, error: "变量 ID 不能为空" };
  if (!name || !name.trim()) return { success: false, error: "变量名不能为空" };
  if (name.trim().length > 50) return { success: false, error: "变量名不能超过 50 个字符" };
  if (!/^[A-Za-z_]\w*$/.test(name.trim())) return { success: false, error: "变量名只能包含字母、数字和下划线，且必须以字母或下划线开头" };
  try {
    const duplicate = getAllVariables().find((v) => v.id !== id && v.name === name.trim());
    if (duplicate) return { success: false, error: "变量名已存在" };
    const result = updateVariable(id, { name: name.trim(), value });
    if (!result) return { success: false, error: "变量不存在" };
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("更新变量失败:", e);
    return { success: false, error: "更新变量失败" };
  }
}

export async function deleteVariableAction(id: string): Promise<ActionResult> {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  if (!id) return { success: false, error: "变量 ID 不能为空" };
  try {
    const ok = deleteVariable(id);
    if (!ok) return { success: false, error: "变量不存在" };
    revalidatePath("/");
    revalidatePath("/dash");
    return { success: true };
  } catch (e) {
    console.error("删除变量失败:", e);
    return { success: false, error: "删除变量失败" };
  }
}
