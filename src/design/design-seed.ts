import crypto from "node:crypto";
import { designArchetypes, DesignArchetype } from "./archetypes";

export type DesignSeed = {
  seed: string;
  preferred_archetype: DesignArchetype;
  mood_hint: string;
  color_hint: string;
};

export function createDesignSeed(keyword: string): DesignSeed {
  const lower = keyword.toLowerCase();
  const seed = crypto.createHash("sha256").update(lower).digest("hex").slice(0, 12);

  if (lower.includes("401k") || lower.includes("retirement")) {
    return {
      seed,
      preferred_archetype: "financial-planning-dashboard",
      mood_hint: "premium finance dashboard",
      color_hint: "calm green-blue"
    };
  }

  const index = Number.parseInt(seed.slice(0, 8), 16) % designArchetypes.length;
  return {
    seed,
    preferred_archetype: designArchetypes[index],
    mood_hint: "polished utility tool",
    color_hint: "balanced distinctive palette"
  };
}
