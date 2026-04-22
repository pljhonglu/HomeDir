import { NextResponse } from "next/server";
import { readIcon } from "@/lib/icons-fs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const icon = readIcon(name);
  if (!icon) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(new Uint8Array(icon.buf), {
    headers: {
      "Content-Type": icon.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
