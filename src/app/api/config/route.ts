import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getConfig, updateConfig } from "@/lib/db";

export async function GET(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  const config = getConfig();
  const safeConfig = {
    site_name: config.site_name,
    site_description: config.site_description,
    footer_text: config.footer_text,
  };

  return NextResponse.json({ config: safeConfig });
}

export async function PUT(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const allowedKeys = ["site_name", "site_description", "footer_text"];
    const updates: Record<string, string> = {};

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (updates.site_name !== undefined && !updates.site_name.trim()) {
      return NextResponse.json({ error: "站点名称不能为空" }, { status: 400 });
    }
    if (updates.site_description !== undefined && !updates.site_description.trim()) {
      return NextResponse.json({ error: "站点描述不能为空" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
    }

    updateConfig(updates);
    const config = getConfig();
    const safeConfig = {
      site_name: config.site_name,
      site_description: config.site_description,
      footer_text: config.footer_text,
    };

    return NextResponse.json({ config: safeConfig });
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }
}
