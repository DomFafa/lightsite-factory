import { z } from "zod";
import { designArchetypes } from "./archetypes";
import { createDesignSeed } from "./design-seed";

export const UiFingerprintSchema = z.object({
  layout_archetype: z.enum(designArchetypes),
  background_style: z.string().min(1),
  primary_color_family: z.string().min(1),
  card_style: z.string().min(1),
  typography_style: z.string().min(1),
  hero_strategy: z.string().min(1),
  result_panel_style: z.string().min(1)
});

export type UiFingerprint = z.infer<typeof UiFingerprintSchema>;

export function defaultFingerprintForKeyword(keyword: string): UiFingerprint {
  const seed = createDesignSeed(keyword);
  if (seed.preferred_archetype === "financial-planning-dashboard") {
    return {
      layout_archetype: "financial-planning-dashboard",
      background_style: "soft-grid-gradient",
      primary_color_family: "green-blue",
      card_style: "rounded glass finance cards",
      typography_style: "large readable sans",
      hero_strategy: "tool-first",
      result_panel_style: "prominent projected balance card"
    };
  }

  return {
    layout_archetype: seed.preferred_archetype,
    background_style: "layered subtle utility background",
    primary_color_family: seed.color_hint,
    card_style: "crisp static tool panels",
    typography_style: "readable modern sans",
    hero_strategy: "tool-first",
    result_panel_style: "clear primary output panel"
  };
}
