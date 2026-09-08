import type { LucideIcon } from "lucide-react";

export type MentorCardStat = {
  key: string;
  label: string;
  value: string | number;
  icon: LucideIcon | null;
  valueClassName: string;
  iconClassName: string;
};
