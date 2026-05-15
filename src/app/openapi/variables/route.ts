import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getAllVariables, updateVariableByName } from "@/lib/db";

export async function GET(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  const rows = getAllVariables();
  const variables = rows.map((v) => ({
    id: v.id,
    name: v.name,
    value: v.value,
    created_at: v.created_at,
    updated_at: v.updated_at,
  }));

  return NextResponse.json({ variables });
}

export async function PUT(req: Request) {
  const authErr = await authenticateRequest(req);
  if (authErr) return authErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const { name, value } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "变量名不能为空" }, { status: 400 });
  }
  if (typeof value !== "string") {
    return NextResponse.json({ error: "变量值必须为字符串" }, { status: 400 });
  }

  try {
    const result = updateVariableByName(name.trim(), value);
    if (!result) {
      return NextResponse.json({ error: "变量不存在" }, { status: 404 });
    }

    return NextResponse.json({
      variable: {
        id: result.id,
        name: result.name,
        value: result.value,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
    });
  } catch (e) {
    console.error("更新变量失败:", e);
    return NextResponse.json({ error: "更新变量失败" }, { status: 500 });
  }
}
