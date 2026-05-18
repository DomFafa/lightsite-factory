import fs from "node:fs";
import OpenAI from "openai";
import { getEnv, loadEnv, requireEnv } from "../utils/env";
import { appendImageUsage } from "./usage";

export type ImageGenerationResult = {
  model: string;
  size: string;
  bytes: Buffer;
};

export async function generateImageTarget(args: {
  prompt: string;
  runDir: string;
  modelEnv?: string;
  sizeEnv?: string;
}): Promise<ImageGenerationResult> {
  loadEnv();
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = requireEnv(args.modelEnv ?? "OPENAI_IMAGE_MODEL");
  const size = getEnv(args.sizeEnv ?? "OPENAI_IMAGE_SIZE") ?? "1536x1024";
  const client = new OpenAI({ apiKey });

  const imagesApi = (client as unknown as { images?: { generate?: (request: unknown) => Promise<unknown> } })
    .images;
  if (!imagesApi?.generate) {
    throw new Error(
      "The installed OpenAI SDK does not expose images.generate. Update the openai package or use --code-only."
    );
  }

  const request: Record<string, unknown> = {
    model,
    prompt: args.prompt,
    size,
    n: 1
  };
  if (!/gpt-image-1/i.test(model)) {
    request.response_format = "b64_json";
  }

  const response = (await imagesApi.generate(request)) as { data?: Array<{ b64_json?: string; url?: string }> };

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI image generation returned no base64 image data.");
  }

  const bytes = Buffer.from(b64, "base64");
  appendImageUsage({
    runDir: args.runDir,
    model,
    imageSize: size,
    imageCount: 1
  });
  return { model, size, bytes };
}

export function writeImageFile(filePath: string, bytes: Buffer): void {
  fs.writeFileSync(filePath, bytes);
}
