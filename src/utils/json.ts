import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeJson(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson<T>(filePath: string, schema?: z.ZodType<T>): T {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return schema ? schema.parse(parsed) : (parsed as T);
}

export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
