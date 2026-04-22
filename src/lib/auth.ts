import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { getConfig, updateConfig } from "@/lib/db";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

function hash(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

/** 是否已设置密码 */
export function hasPassword(): boolean {
  return !!getConfig().admin_password;
}

/** 设置密码（首次） */
export function setPassword(password: string): void {
  updateConfig({ admin_password: hash(password) });
}

/** 验证密码并设置 session cookie */
export async function login(password: string): Promise<boolean> {
  const stored = getConfig().admin_password;
  if (!stored || hash(password) !== stored) return false;

  const token = randomBytes(32).toString("hex");
  updateConfig({ admin_session: token });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return true;
}

/** 检查当前请求是否已登录 */
export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === getConfig().admin_session;
}

/** 登出 */
export async function logout(): Promise<void> {
  updateConfig({ admin_session: "" });
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
