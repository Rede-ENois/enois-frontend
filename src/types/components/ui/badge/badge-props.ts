import type { HTMLAttributes } from "react";

export type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | null;
};
