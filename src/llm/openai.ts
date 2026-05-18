import OpenAI from "openai";
import { z } from "zod";
import { getEnv, loadEnv, requireEnv } from "../utils/env";
import { appendTextUsage, type TextUsageRecord } from "./usage";

export type StructuredJsonRequest<T> = {
  modelEnv?: string;
  schemaName: string;
  jsonSchema: unknown;
  zodSchema: z.ZodType<T>;
  messages: Array<{ role: "system" | "user"; content: unknown }>;
  runDir?: string;
  stage?: TextUsageRecord["stage"];
};

export async function requestStructuredJson<T>(
  request: StructuredJsonRequest<T>
): Promise<T> {
  loadEnv();

  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = getEnv(request.modelEnv ?? "OPENAI_MODEL");
  if (!model) {
    throw new Error(`Missing required environment variable: ${request.modelEnv ?? "OPENAI_MODEL"}`);
  }

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model,
    messages: request.messages as never,
    response_format: {
      type: "json_schema",
      json_schema: request.jsonSchema as never
    }
  });

  if (request.runDir && request.stage) {
    appendTextUsage({
      runDir: request.runDir,
      stage: request.stage,
      model,
      usage: response.usage ?? null
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`OpenAI returned no content for ${request.schemaName}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`OpenAI returned invalid JSON for ${request.schemaName}: ${String(error)}`);
  }

  return request.zodSchema.parse(parsed);
}
