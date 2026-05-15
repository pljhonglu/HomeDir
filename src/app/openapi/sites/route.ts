import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getAllSites, createSite, updateSite, deleteSite } from "@/lib/db";

export async function GET(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  const rows = getAllSites();
  const sites = rows.map((r) => ({
    id: r.id,
    name: r.name,
    desc: r.desc,
    icon: r.icon,
    icon_url: r.icon_url,
    category: r.category,
    url: { internal: r.url_internal, external: r.url_external },
    sort_order: r.sort_order,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return NextResponse.json({ sites });
}

export async function POST(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { name, desc, icon, icon_url, category, url_internal, url_external, sort_order } = body;

    if (!name || !name.trim()) return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    if (!category || !category.trim()) return NextResponse.json({ error: "分类不能为空" }, { status: 400 });
    if (!url_internal && !url_external) return NextResponse.json({ error: "至少填写一个地址" }, { status: 400 });

    const site = createSite({
      name: name.trim(),
      desc: desc || "",
      icon: icon || "Globe",
      icon_url: icon_url || "",
      category: category.trim(),
      url_internal: url_internal || "",
      url_external: url_external || "",
      sort_order: sort_order ?? 0,
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "缺少站点 ID" }, { status: 400 });

    const site = updateSite(id, updates);
    if (!site) return NextResponse.json({ error: "站点不存在" }, { status: 404 });

    return NextResponse.json({ site });
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "缺少站点 ID" }, { status: 400 });

  const ok = deleteSite(id);
  if (!ok) return NextResponse.json({ error: "站点不存在" }, { status: 404 });

  return NextResponse.json({ success: true });
}
