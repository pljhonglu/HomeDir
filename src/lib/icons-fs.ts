import path from "path";
import fs from "fs";
import crypto from "crypto";

const ICONS_DIR = path.join(process.cwd(), "data", "icons");

function ensureDir() {
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }
}

/** 保存图标文件，返回文件名（content-hash） */
export function saveIcon(buf: Buffer): string {
  ensureDir();
  const hash = crypto.createHash("md5").update(buf).digest("hex").slice(0, 12);
  // 尝试检测文件类型
  const ext = detectExt(buf);
  const filename = `${hash}${ext}`;
  const filepath = path.join(ICONS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, buf);
  }
  return filename;
}

/** 读取图标文件，返回 Buffer 和 mime type */
export function readIcon(filename: string): { buf: Buffer; mime: string } | null {
  const filepath = path.join(ICONS_DIR, path.basename(filename));
  if (!fs.existsSync(filepath)) return null;
  const buf = fs.readFileSync(filepath);
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };
  return { buf, mime: mimeMap[ext] || "image/png" };
}

/** 删除图标文件 */
export function deleteIcon(filename: string): void {
  if (!filename) return;
  const filepath = path.join(ICONS_DIR, path.basename(filename));
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

function detectExt(buf: Buffer): string {
  if (buf[0] === 0x89 && buf[1] === 0x50) return ".png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return ".jpg";
  if (buf[0] === 0x47 && buf[1] === 0x49) return ".gif";
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return ".ico";
  if (buf[0] === 0x52 && buf[1] === 0x49) return ".webp";
  if (buf[0] === 0x3c) return ".svg"; // starts with <
  return ".png"; // fallback
}
