import OpenAI from "openai";
import { z } from "zod";
import { getEnv, loadEnv, requireEnv } from "../utils/env";

export type StructuredJsonRequest<T> = {
  modelEnv?: string;
  schemaName: string;
  jsonSchema: unknown;
  zodSchema: z.ZodType<T>;
  messages: Array<{ role: "system" | "user"; content: unknown }>;
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
