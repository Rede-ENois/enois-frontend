import { Link } from "@tanstack/react-router";

import { Sparkles } from "lucide-react";

import { texts } from "@/texts";

import { ThemeToggle } from "@/components/theme-toggle";

export function AuthMobileHeader() {
  return (
    <div className="flex items-center justify-between lg:hidden">
      <Link to="/" className="flex items-center gap-2">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight">
          {texts.brand.prefix}
          <span className="gradient-text">{texts.brand.accent}</span>
        </span>
      </Link>
      <ThemeToggle />
    </div>
  );
}
