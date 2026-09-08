import type { LucideIcon } from "lucide-react";

export type ProfileHeaderAction = {
  key: string;
  label: string;
  icon: LucideIcon | null;
  variant: "default" | "outline";
  onClick: () => void;
  disabled: boolean;
};
