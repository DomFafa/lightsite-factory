import fs from "node:fs";
import { getEnv, loadEnv } from "../utils/env";
import { writeJson } from "../utils/json";
import { readPrompt } from "../llm/prompts";
import { requestStructuredJson } from "../llm/openai";
import {
  VisionReviewSchema,
  visionReviewJsonSchema,
  type VisionReview
} from "../llm/schemas";

export type VisionReviewResult =
  | VisionReview
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      reason: string;
      required_fixes: string[];
    };

export async function runVisionReview(args: {
  desktopPath: string;
  mobilePath: string;
  designBrief: unknown;
  toolSpec: unknown;
  outputPath: string;
  cwd?: string;
}): Promise<VisionReviewResult> {
  loadEnv(args.cwd);
  if (!getEnv("OPENAI_API_KEY") || !getEnv("OPENAI_QA_MODEL")) {
    const skipped = {
      status: "skipped" as const,
      reason:
        "UX Vision Review skipped because OpenAI QA model is not configured. Production pass should not be considered final."
    };
    writeJson(args.outputPath, skipped);
    return skipped;
  }

  try {
    const prompt = readPrompt("vision-review.md", args.cwd);
    const desktop = fs.readFileSync(args.desktopPath).toString("base64");
    const mobile = fs.readFileSync(args.mobilePath).toString("base64");

    const result = await requestStructuredJson({
      modelEnv: "OPENAI_QA_MODEL",
      schemaName: "UX vision review",
      jsonSchema: visionReviewJsonSchema,
      zodSchema: VisionReviewSchema,
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  design_brief: args.designBrief,
                  tool_spec: args.toolSpec,
                  instruction:
                    "Review these real rendered screenshots. Score the rendered UX, not the source files."
                },
                null,
                2
              )
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${desktop}` }
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${mobile}` }
            }
          ]
        }
      ]
    });

    writeJson(args.outputPath, result);
    return result;
  } catch (error) {
    const failed = {
      status: "failed" as const,
      reason: error instanceof Error ? error.message : String(error),
      required_fixes: []
    };
    writeJson(args.outputPath, failed);
    return failed;
  }
}
