import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
  asChild?: boolean;
};
