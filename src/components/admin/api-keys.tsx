"use client";

import { useState, useCallback, useEffect } from "react";
import { createApiKeyAction, listApiKeysAction, deleteApiKeyAction } from "@/app/dash/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Key, Copy, Check } from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

interface NewKeyResult {
  id: string;
  name: string;
  key: string;
  prefix: string;
  created_at: string;
}

export function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState<NewKeyResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    const result = await listApiKeysAction();
    if (result.success) {
      setKeys(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) { toast.error("请输入名称"); return; }
    setCreating(true);
    try {
      const result = await createApiKeyAction(newName.trim());
      if (!result.success) { toast.error(result.error); return; }
      setNewKeyResult(result.data);
      setNewName("");
      setCopied(false);
      await fetchKeys();
      toast.success("API Key 已创建");
    } finally { setCreating(false); }
  }, [newName, fetchKeys]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteApiKeyAction(id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("API Key 已删除");
      await fetchKeys();
    } finally { setDeletingId(null); }
  }, [fetchKeys]);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleCloseNewKey = useCallback(() => {
    setNewKeyResult(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Key className="size-4" />
          API Key 管理
        </div>
        <p className="mb-4 text-[11px] text-muted-foreground">
          通过 API Key 调用公开接口管理站点和配置。使用 <code className="rounded bg-muted px-1 py-0.5 text-[10px]">Authorization: Bearer &lt;key&gt;</code> 或 <code className="rounded bg-muted px-1 py-0.5 text-[10px]">?apikey=&lt;key&gt;</code> 认证。
        </p>

        {/* 新创建的 Key 展示 */}
        {newKeyResult && (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
            <div className="mb-2 text-xs font-medium text-green-600">API Key 已创建，请立即复制！关闭后无法再次查看。</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs break-all">{newKeyResult.key}</code>
              <Button variant="outline" size="icon-sm" onClick={() => handleCopy(newKeyResult.key)}>
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <div className="mt-2 flex justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCloseNewKey}>
                我已复制，关闭
              </Button>
            </div>
          </div>
        )}

        {/* 已有 Key 列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            暂无 API Key
          </div>
        ) : (
          <div className="mb-4 space-y-1.5">
            {keys.map((k) => (
              <div
                key={k.id}
                className="group flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-accent/20"
              >
                <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                  <Key className="size-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{k.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    <code>{k.prefix}</code>••••••
                    {k.last_used_at && <span className="ml-2">最近使用: {k.last_used_at}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive/60 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={() => handleDelete(k.id)}
                  disabled={deletingId === k.id}
                >
                  {deletingId === k.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 创建新 Key */}
        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1 grid gap-1.5">
            <Label htmlFor="apikey-name" className="text-xs">名称</Label>
            <Input
              id="apikey-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：自动化脚本"
              className="h-8 text-xs"
              maxLength={50}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            />
          </div>
          <Button size="sm" className="h-8 shrink-0" onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            创建
          </Button>
        </div>
      </div>

      {/* API 使用说明 */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 text-sm font-medium">API 使用说明</div>
        <div className="space-y-2 text-[11px] text-muted-foreground">
          <div>
            <div className="font-medium text-foreground/80">获取站点列表</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">GET /openapi/sites</code>
          </div>
          <div>
            <div className="font-medium text-foreground/80">创建站点</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">POST /openapi/sites {"{ name, category, url_internal, url_external, ... }"}</code>
          </div>
          <div>
            <div className="font-medium text-foreground/80">更新站点</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">PUT /openapi/sites {"{ id, name, ... }"}</code>
          </div>
          <div>
            <div className="font-medium text-foreground/80">删除站点</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">DELETE /openapi/sites?id=&lt;site_id&gt;</code>
          </div>
          <div>
            <div className="font-medium text-foreground/80">获取配置</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">GET /openapi/config</code>
          </div>
          <div>
            <div className="font-medium text-foreground/80">更新配置</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">PUT /openapi/config {"{ site_name, site_description, footer_text }"}</code>
          </div>
          <div>
            <div className="font-medium text-foreground/80">获取变量列表</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">GET /openapi/variables</code>
          </div>
          <div>
            <div className="font-medium text-foreground/80">修改变量值</div>
            <code className="block rounded bg-muted px-2 py-1 mt-1">PUT /openapi/variables {"{ name, value }"}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
