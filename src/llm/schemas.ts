import { z } from "zod";
import { UiFingerprintSchema } from "../design/fingerprint";

export const BriefSchema = z.object({
  keyword: z.string().min(1),
  site_type: z.string().min(1),
  target_users: z.array(z.string().min(1)).min(1),
  primary_goal: z.string().min(1),
  non_goals: z.array(z.string().min(1)).min(1)
});

export const DesignBriefSchema = z.object({
  visual_mood: z.string().min(1),
  layout_archetype: z.string().min(1),
  senior_friendly: z.boolean(),
  style_rules: z.array(z.string().min(1)).min(1),
  forbidden_styles: z.array(z.string().min(1)).min(1)
});

export const SeoPlanSchema = z.object({
  title: z.string().min(1),
  meta_description: z.string().min(1),
  canonical_url: z.string().url(),
  h1: z.string().min(1),
  required_sections: z.array(z.string().min(1)).min(1),
  structured_data: z.array(z.string().min(1)).min(1)
});

export const ToolSpecSchema = z.object({
  tool_family: z.string().min(1),
  complexity: z.enum(["simple", "medium", "complex"]),
  inputs: z.array(z.string().min(1)).min(1),
  outputs: z.array(z.string().min(1)).min(1),
  controls: z.array(z.string().min(1)).min(1),
  primary_actions: z.array(z.string().min(1)).min(1),
  secondary_actions: z.array(z.string().min(1)),
  states: z.array(z.string().min(1)).min(1),
  validation_rules: z.array(z.string().min(1)).min(1),
  local_only_requirements: z.array(z.string().min(1)),
  disclaimer: z.string().min(1),
  implementation_notes: z.array(z.string().min(1)).min(1),
  formula_summary: z.string().min(1).nullable().optional()
});

export const PlanningArtifactsSchema = z.object({
  brief: BriefSchema,
  design_brief: DesignBriefSchema,
  seo_plan: SeoPlanSchema,
  tool_spec: ToolSpecSchema,
  ui_fingerprint: UiFingerprintSchema
});

export const GeneratedSiteSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string().min(1)
      })
    )
    .min(5)
});

export const VisionReviewSchema = z.object({
  status: z.enum(["passed", "failed"]),
  visual_polish: z.number().min(0).max(10),
  tool_clarity: z.number().min(0).max(10),
  layout_hierarchy: z.number().min(0).max(10),
  mobile_quality: z.number().min(0).max(10),
  senior_friendliness: z.number().min(0).max(10),
  uniqueness: z.number().min(0).max(10),
  first_viewport_is_tool: z.boolean(),
  default_form_like: z.boolean(),
  admin_dashboard_like: z.boolean(),
  pure_marketing_landing: z.boolean(),
  summary: z.string(),
  required_fixes: z.array(z.string())
});

export type Brief = z.infer<typeof BriefSchema>;
export type DesignBrief = z.infer<typeof DesignBriefSchema>;
export type SeoPlan = z.infer<typeof SeoPlanSchema>;
export type ToolSpec = z.infer<typeof ToolSpecSchema>;
export type PlanningArtifacts = z.infer<typeof PlanningArtifactsSchema>;
export type GeneratedSite = z.infer<typeof GeneratedSiteSchema>;
export type VisionReview = z.infer<typeof VisionReviewSchema>;

export const planningArtifactsJsonSchema = {
  name: "planning_artifacts",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["brief", "design_brief", "seo_plan", "tool_spec", "ui_fingerprint"],
    properties: {
      brief: {
        type: "object",
        additionalProperties: false,
        required: ["keyword", "site_type", "target_users", "primary_goal", "non_goals"],
        properties: {
          keyword: { type: "string" },
          site_type: { type: "string" },
          target_users: { type: "array", items: { type: "string" } },
          primary_goal: { type: "string" },
          non_goals: { type: "array", items: { type: "string" } }
        }
      },
      design_brief: {
        type: "object",
        additionalProperties: false,
        required: [
          "visual_mood",
          "layout_archetype",
          "senior_friendly",
          "style_rules",
          "forbidden_styles"
        ],
        properties: {
          visual_mood: { type: "string" },
          layout_archetype: { type: "string" },
          senior_friendly: { type: "boolean" },
          style_rules: { type: "array", items: { type: "string" } },
          forbidden_styles: { type: "array", items: { type: "string" } }
        }
      },
      seo_plan: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "meta_description",
          "canonical_url",
          "h1",
          "required_sections",
          "structured_data"
        ],
        properties: {
          title: { type: "string" },
          meta_description: { type: "string" },
          canonical_url: { type: "string" },
          h1: { type: "string" },
          required_sections: { type: "array", items: { type: "string" } },
          structured_data: { type: "array", items: { type: "string" } }
        }
      },
      tool_spec: {
        type: "object",
        additionalProperties: false,
        required: [
          "tool_family",
          "complexity",
          "inputs",
          "outputs",
          "controls",
          "primary_actions",
          "secondary_actions",
          "states",
          "validation_rules",
          "local_only_requirements",
          "disclaimer",
          "implementation_notes",
          "formula_summary"
        ],
        properties: {
          tool_family: { type: "string" },
          complexity: { type: "string", enum: ["simple", "medium", "complex"] },
          inputs: { type: "array", items: { type: "string" } },
          outputs: { type: "array", items: { type: "string" } },
          controls: { type: "array", items: { type: "string" } },
          primary_actions: { type: "array", items: { type: "string" } },
          secondary_actions: { type: "array", items: { type: "string" } },
          states: { type: "array", items: { type: "string" } },
          validation_rules: { type: "array", items: { type: "string" } },
          local_only_requirements: { type: "array", items: { type: "string" } },
          disclaimer: { type: "string" },
          implementation_notes: { type: "array", items: { type: "string" } },
          formula_summary: { type: ["string", "null"] }
        }
      },
      ui_fingerprint: {
        type: "object",
        additionalProperties: false,
        required: [
          "layout_archetype",
          "background_style",
          "primary_color_family",
          "card_style",
          "typography_style",
          "hero_strategy",
          "result_panel_style"
        ],
        properties: {
          layout_archetype: {
            type: "string",
            enum: [
              "split-calculator-dashboard",
              "centered-tool-lab",
              "editorial-tool-report",
              "soft-saas-command-center",
              "compact-mobile-first-card",
              "financial-planning-dashboard",
              "utility-console-clean",
              "colorful-generator-studio"
            ]
          },
          background_style: { type: "string" },
          primary_color_family: { type: "string" },
          card_style: { type: "string" },
          typography_style: { type: "string" },
          hero_strategy: { type: "string" },
          result_panel_style: { type: "string" }
        }
      }
    }
  },
  strict: true
} as const;

export const generatedSiteJsonSchema = {
  name: "generated_site_files",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["files"],
    properties: {
      files: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["path", "content"],
          properties: {
            path: { type: "string" },
            content: { type: "string" }
          }
        }
      }
    }
  },
  strict: true
} as const;

export const visionReviewJsonSchema = {
  name: "ux_vision_review",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "status",
      "visual_polish",
      "tool_clarity",
      "layout_hierarchy",
      "mobile_quality",
      "senior_friendliness",
      "uniqueness",
      "first_viewport_is_tool",
      "default_form_like",
      "admin_dashboard_like",
      "pure_marketing_landing",
      "summary",
      "required_fixes"
    ],
    properties: {
      status: { type: "string", enum: ["passed", "failed"] },
      visual_polish: { type: "number" },
      tool_clarity: { type: "number" },
      layout_hierarchy: { type: "number" },
      mobile_quality: { type: "number" },
      senior_friendliness: { type: "number" },
      uniqueness: { type: "number" },
      first_viewport_is_tool: { type: "boolean" },
      default_form_like: { type: "boolean" },
      admin_dashboard_like: { type: "boolean" },
      pure_marketing_landing: { type: "boolean" },
      summary: { type: "string" },
      required_fixes: { type: "array", items: { type: "string" } }
    }
  },
  strict: true
} as const;
