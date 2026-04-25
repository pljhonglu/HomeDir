"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { SiteData } from "@/lib/types";
import { getIcon, getIconUrl } from "@/lib/icons";
import {
  renameCategoryAction,
  deleteCategoryAction,
  setCategoryOrderAction,
  setDefaultCategoryAction,
} from "@/app/dash/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2, Save, AlertTriangle, Star, GripVertical } from "lucide-react";

export function AdminCategories({ sites, defaultCategory }: { sites: SiteData[]; defaultCategory: string | null }) {
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sites) map.set(s.category, (map.get(s.category) || 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sites]);

  // 拖拽排序
  const [orderedCategories, setOrderedCategories] = useState<string[]>(() =>
    categoryStats.map(([cat]) => cat)
  );
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // 同步新增的分类（当有新站点创建了新分类时）
  useEffect(() => {
    const currentCats = new Set(orderedCategories);
    const newCats = categoryStats
      .map(([cat]) => cat)
      .filter((cat) => !currentCats.has(cat));
    if (newCats.length > 0) {
      setOrderedCategories((prev) => [...prev, ...newCats]);
    }
  }, [categoryStats]);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setDragOverIdx(idx);
  };

  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const newOrder = [...orderedCategories];
    const [moved] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    setOrderedCategories(newOrder);
    setDraggedIdx(null);
    setDragOverIdx(null);

    setSavingOrder(true);
    try {
      const result = await setCategoryOrderAction(newOrder);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("分类排序已保存");
    } finally { setSavingOrder(false); }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // 设置默认分类
  const [settingDefault, setSettingDefault] = useState(false);
  const handleSetDefault = useCallback(async (cat: string) => {
    setSettingDefault(true);
    try {
      const result = await setDefaultCategoryAction(cat);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(`已将「${cat}」设为默认分类`);
    } finally { setSettingDefault(false); }
  }, []);

  const handleClearDefault = useCallback(async () => {
    setSettingDefault(true);
    try {
      const result = await setDefaultCategoryAction(null);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("已清除默认分类");
    } finally { setSettingDefault(false); }
  }, []);

  // 重命名
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const openRename = (name: string) => {
    setRenameTarget(name);
    setRenameValue(name);
  };

  const handleRename = useCallback(async () => {
    if (!renameTarget) return;
    setRenaming(true);
    try {
      const result = await renameCategoryAction(renameTarget, renameValue);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(`已重命名为「${renameValue}」`);
      setRenameTarget(null);
      setOrderedCategories(prev => prev.map(c => c === renameTarget ? renameValue : c));
    } finally { setRenaming(false); }
  }, [renameTarget, renameValue]);

  // 删除
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const handleDeleteItem = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletingItem(true);
    try {
      const result = await deleteCategoryAction(deleteTarget);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("分类及其站点已删除");
      setOrderedCategories(prev => prev.filter(c => c !== deleteTarget));
      setDeleteTarget(null);
    } finally { setDeletingItem(false); }
  }, [deleteTarget]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">拖拽排序，Star 设为默认分类</p>
        {savingOrder && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {categoryStats.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
            暂无分类
          </div>
        ) : (
          orderedCategories.map((cat, idx) => {
            const count = categoryStats.find(([c]) => c === cat)?.[1] || 0;
            const catSites = sites.filter((s) => s.category === cat);
            const isDefault = defaultCategory === cat;
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx;

            return (
              <div
                key={cat}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`group rounded-lg border bg-card p-4 transition-all hover:bg-accent/20 ${
                  isDragging ? "opacity-50" : ""
                } ${isDragOver ? "ring-2 ring-primary" : ""}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="size-3.5 cursor-grab text-muted-foreground/50" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{cat}</span>
                        {isDefault && <Star className="size-3 fill-yellow-400 text-yellow-400" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{count} 个站点</div>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => isDefault ? handleClearDefault() : handleSetDefault(cat)}
                      disabled={settingDefault}
                      title={isDefault ? "取消默认" : "设为默认"}
                    >
                      <Star className={`size-3.5 ${isDefault ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openRename(cat)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {catSites.slice(0, 3).map((site) => {
                    const Icon = getIcon(site.icon);
                    return (
                      <div key={site.id} className="flex items-center gap-2">
                        {site.icon_url ? (
                          <img src={getIconUrl(site.icon_url)} alt="" className="size-4 shrink-0 rounded object-contain" />
                        ) : (
                          <Icon className="size-3.5 text-muted-foreground/60" />
                        )}
                        <span className="truncate text-xs text-muted-foreground">{site.name}</span>
                      </div>
                    );
                  })}
                  {catSites.length > 3 && (
                    <div className="text-[10px] text-muted-foreground/50">
                      还有 {catSites.length - 3} 个…
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 重命名分类弹窗 */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重命名分类</DialogTitle>
            <DialogDescription>
              将「{renameTarget}」重命名为新名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新名称"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRenameTarget(null)}>
              取消
            </Button>
            <Button size="sm" onClick={handleRename} disabled={renaming || !renameValue.trim()}>
              {renaming ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              确认
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除分类确认弹窗 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除分类「{deleteTarget}」吗？该分类下的所有站点也会被删除。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteItem}
              disabled={deletingItem}
            >
              {deletingItem ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
