import fs from "node:fs";
import path from "node:path";

export function readPrompt(name: string, cwd = process.cwd()): string {
  const filePath = path.join(cwd, "prompts", name);
  return fs.readFileSync(filePath, "utf8");
}
