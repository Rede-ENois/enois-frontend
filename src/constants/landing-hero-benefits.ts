import { texts } from "@/texts";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export const LANDING_HERO_BENEFITS = [
  { key: "no-vanity", icon: Heart, label: texts.landing.hero.benefits.noVanity },
  { key: "safe", icon: ShieldCheck, label: texts.landing.hero.benefits.safe },
  { key: "free", icon: Sparkles, label: texts.landing.hero.benefits.freeForever },
] as const;
