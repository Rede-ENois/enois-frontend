import { Link } from "@tanstack/react-router";

import { Sparkles } from "lucide-react";

import { texts } from "@/texts";
import type { AppBrandProps } from "@/types/components/app-brand-props";

export function AppBrand({ onClick, variant = "app" }: AppBrandProps) {
  const isAuth = variant !== "app";
  const isAuthDesktop = variant === "auth-desktop";

  return (
    <Link
      to={isAuth ? "/" : "/feed"}
      onClick={onClick}
      className={
        isAuthDesktop
          ? "relative flex items-center gap-2"
          : variant === "auth-mobile"
            ? "flex items-center gap-2"
            : "flex shrink-0 items-center gap-2"
      }
    >
      <div
        className={
          isAuthDesktop
            ? "grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/20 backdrop-blur"
            : variant === "auth-mobile"
              ? "grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
              : "grid h-8 w-8 place-items-center rounded-xl text-primary-foreground sm:h-9 sm:w-9"
        }
        style={isAuthDesktop ? undefined : { background: "var(--gradient-primary)" }}
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <span
        className={
          variant === "auth-mobile"
            ? "font-semibold tracking-tight"
            : "text-lg font-semibold tracking-tight"
        }
      >
        <>{texts.brand.prefix}</><span className="gradient-text">{texts.brand.accent}</span>
      </span>
    </Link>
  );
}
