import { texts } from "@/texts";
import type { LandingInfoCardProps } from "@/types/components/landing/landing-info-card-props";
import { GraduationCap, Heart, ShieldCheck, Users } from "lucide-react";

export const LANDING_PHILOSOPHY_VALUES = [
  {
    icon: Heart,
    title: texts.landing.philosophy.values.authenticity.title,
    description: texts.landing.philosophy.values.authenticity.description,
    variant: "philosophy",
  },
  {
    icon: Users,
    title: texts.landing.philosophy.values.collaboration.title,
    description: texts.landing.philosophy.values.collaboration.description,
    variant: "philosophy",
  },
  {
    icon: GraduationCap,
    title: texts.landing.philosophy.values.learning.title,
    description: texts.landing.philosophy.values.learning.description,
    variant: "philosophy",
  },
  {
    icon: ShieldCheck,
    title: texts.landing.philosophy.values.safety.title,
    description: texts.landing.philosophy.values.safety.description,
    variant: "philosophy",
  },
] satisfies readonly LandingInfoCardProps[];
