import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 从字符串名称获取 lucide 图标组件
export function getIcon(name: string): LucideIcon {
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  return icon || LucideIcons.Globe;
}

/** 获取图标的显示 URL */
export function getIconUrl(iconUrl: string): string {
  if (!iconUrl) return "";
  return `/api/icons/${iconUrl}`;
}

// 动态获取所有 lucide 图标名称
export const commonIcons = Object.keys(LucideIcons.icons).sort();
