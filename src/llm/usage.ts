import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "../utils/json";

export type TextUsageRecord = {
  stage: "planning" | "site-generation" | "vision-review";
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  created_at: string;
};

export type ImageUsageRecord = {
  stage: "design-target";
  model: string;
  image_size: string;
  image_count: number;
  created_at: string;
};

export type UsageRecord = TextUsageRecord | ImageUsageRecord;

export function appendUsageRecord(runDir: string, record: UsageRecord): void {
  const usagePath = path.join(runDir, "usage.jsonl");
  ensureDir(path.dirname(usagePath));
  fs.appendFileSync(usagePath, `${JSON.stringify(record)}\n`, "utf8");
}

export function appendTextUsage(args: {
  runDir: string;
  stage: TextUsageRecord["stage"];
  model: string;
  usage?: {
    prompt_tokens?: number | null;
    completion_tokens?: number | null;
    total_tokens?: number | null;
  } | null;
}): void {
  appendUsageRecord(args.runDir, {
    stage: args.stage,
    model: args.model,
    prompt_tokens: args.usage?.prompt_tokens ?? null,
    completion_tokens: args.usage?.completion_tokens ?? null,
    total_tokens: args.usage?.total_tokens ?? null,
    created_at: new Date().toISOString()
  });
}

export function appendImageUsage(args: {
  runDir: string;
  model: string;
  imageSize: string;
  imageCount: number;
}): void {
  appendUsageRecord(args.runDir, {
    stage: "design-target",
    model: args.model,
    image_size: args.imageSize,
    image_count: args.imageCount,
    created_at: new Date().toISOString()
  });
}
