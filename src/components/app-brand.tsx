import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { texts } from "@/texts";

type AppBrandProps = {
  onClick?: () => void;
};

export function AppBrand({ onClick }: AppBrandProps) {
  return (
    <Link to="/feed" onClick={onClick} className="flex shrink-0 items-center gap-2">
      <div
        className="grid h-8 w-8 place-items-center rounded-xl text-primary-foreground sm:h-9 sm:w-9"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <span className="text-lg font-semibold tracking-tight">
        {texts.brand.prefix}<span className="gradient-text">{texts.brand.accent}</span>
      </span>
    </Link>
  );
}
