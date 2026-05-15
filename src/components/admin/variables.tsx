"use client";

import { useState, useCallback } from "react";
import type { VariableData } from "@/lib/types";
import {
  createVariableAction,
  updateVariableAction,
  deleteVariableAction,
} from "@/app/dash/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Save, X, Variable } from "lucide-react";

interface VariableFormData {
  name: string;
  value: string;
}

const emptyForm: VariableFormData = { name: "", value: "" };

export function AdminVariables({ variables }: { variables: VariableData[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariableFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
    setShowCreate(false);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("变量名不能为空");
      return;
    }
    setSaving(true);
    try {
      const result = await createVariableAction(form.name.trim(), form.value);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("变量已创建");
      resetForm();
    } finally {
      setSaving(false);
    }
  }, [form, resetForm]);

  const handleUpdate = useCallback(async () => {
    if (!editingId) return;
    if (!form.name.trim()) {
      toast.error("变量名不能为空");
      return;
    }
    setSaving(true);
    try {
      const result = await updateVariableAction(editingId, form.name.trim(), form.value);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("变量已更新");
      resetForm();
    } finally {
      setSaving(false);
    }
  }, [editingId, form, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteVariableAction(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("变量已删除");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const startEdit = useCallback((v: VariableData) => {
    setEditingId(v.id);
    setForm({ name: v.name, value: v.value });
    setShowCreate(false);
  }, []);

  const startCreate = useCallback(() => {
    setShowCreate(true);
    setEditingId(null);
    setForm(emptyForm);
  }, []);

  const cancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {variables.length} 个变量
        </p>
        <Button size="sm" onClick={startCreate}>
          <Plus className="size-4" />
          添加变量
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Variable className="size-4" />
          自定义变量
        </div>
        <p className="mb-4 text-[11px] text-muted-foreground">
          在站点地址中使用 <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{`{变量名}`}</code> 引用变量，
          打开站点时自动替换为实际值。也可通过 OpenAPI 动态修改变量值。
        </p>

        {variables.length === 0 && !showCreate ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            暂无自定义变量
          </div>
        ) : (
          <div className="mb-3 space-y-1.5">
            {variables.map((v) => (
              <div key={v.id} className="group flex items-center gap-3 rounded-lg border px-3 py-2">
                {editingId === v.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="变量名"
                      className="h-7 w-32 text-xs"
                    />
                    <Input
                      value={form.value}
                      onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                      placeholder="变量值"
                      className="h-7 flex-1 text-xs"
                    />
                    <Button size="icon-sm" variant="ghost" onClick={handleUpdate} disabled={saving}>
                      {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={cancelEdit}>
                      <X className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                      <Variable className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{v.name}</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {`{${v.name}}`}
                        </code>
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {v.value || <span className="italic">空值</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <Button variant="ghost" size="icon-sm" onClick={() => startEdit(v)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive/60 hover:text-destructive"
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                      >
                        {deletingId === v.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 border-dashed">
            <div className="flex size-7 items-center justify-center rounded-md border bg-background">
              <Variable className="size-3.5 text-muted-foreground" />
            </div>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="变量名"
              className="h-7 w-32 text-xs"
            />
            <Input
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              placeholder="变量值"
              className="h-7 flex-1 text-xs"
            />
            <Button size="icon-sm" variant="ghost" onClick={handleCreate} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={cancelEdit}>
              <X className="size-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
