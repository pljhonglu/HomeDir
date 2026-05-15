import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveVariables(url: string, variables: Record<string, string>): string {
  if (!url) return url
  return url.replace(/\{(\w+)\}/g, (_, name) => {
    return variables[name] ?? `{${name}}`
  })
}
