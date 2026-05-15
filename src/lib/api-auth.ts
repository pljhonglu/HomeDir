import { verifyApiKey } from "@/lib/db";
import { NextResponse } from "next/server";

export function extractApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const url = new URL(req.url);
  return url.searchParams.get("apikey");
}

export async function authenticateRequest(req: Request): Promise<NextResponse | null> {
  const rawKey = extractApiKey(req);
  if (!rawKey) {
    return NextResponse.json({ error: "缺少 API Key，请通过 Authorization: Bearer <key> 或 ?apikey=<key> 传递" }, { status: 401 });
  }
  if (!verifyApiKey(rawKey)) {
    return NextResponse.json({ error: "API Key 无效" }, { status: 403 });
  }
  return null;
}
