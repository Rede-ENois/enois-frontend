import { Link } from "@tanstack/react-router";

import { Sparkles } from "lucide-react";

import { APP_BRAND_VARIANTS } from "@/constants/app-brand-variants";
import { texts } from "@/texts";
import type { AppBrandProps } from "@/types/components/app-brand-props";

export function AppBrand({ onClick, variant = "app" }: AppBrandProps) {
  const config = APP_BRAND_VARIANTS[variant];

  return (
    <Link to={config.to} onClick={onClick} className={config.rootClassName}>
      <div className={config.iconClassName} style={config.style}>
        <Sparkles className={config.glyphClassName} />
      </div>
      <span className={config.labelClassName}>
        <>{texts.brand.prefix}</><span className="gradient-text">{texts.brand.accent}</span>
      </span>
    </Link>
  );
}
