import type { LucideIcon } from "lucide-react";

export type LandingInfoCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  variant: "feature" | "philosophy";
};
