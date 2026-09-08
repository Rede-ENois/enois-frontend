import { GraduationCap, Heart, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";

import { texts } from "@/texts";
import type { LandingInfoCardProps } from "@/types/components/landing/landing-info-card-props";

export const LANDING_FEATURES = [
  {
    icon: MessageCircle,
    title: texts.landing.features.items.discussions.title,
    description: texts.landing.features.items.discussions.description,
    variant: "feature",
  },
  {
    icon: GraduationCap,
    title: texts.landing.features.items.mentoring.title,
    description: texts.landing.features.items.mentoring.description,
    variant: "feature",
  },
  {
    icon: Heart,
    title: texts.landing.features.items.communities.title,
    description: texts.landing.features.items.communities.description,
    variant: "feature",
  },
  {
    icon: Users,
    title: texts.landing.features.items.connections.title,
    description: texts.landing.features.items.connections.description,
    variant: "feature",
  },
  {
    icon: ShieldCheck,
    title: texts.landing.features.items.recruiting.title,
    description: texts.landing.features.items.recruiting.description,
    variant: "feature",
  },
  {
    icon: Sparkles,
    title: texts.landing.features.items.wellbeing.title,
    description: texts.landing.features.items.wellbeing.description,
    variant: "feature",
  },
] satisfies readonly LandingInfoCardProps[];
