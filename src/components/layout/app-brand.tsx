import { Link } from "@tanstack/react-router";

import { APP_BRAND_VARIANTS } from "@/constants/layout/app-brand-variants";
import { texts } from "@/texts";
import type { AppBrandProps } from "@/types/layout/app-brand-props";
import { useAppBrandController } from "@/utils/layout/use-app-brand-controller";
import { Sparkles } from "lucide-react";

export function AppBrand({ variant = "app" }: AppBrandProps) {
  const config = APP_BRAND_VARIANTS[variant];
  const { closeMobileNavigation } = useAppBrandController();

  return (
    <Link to={config.to} onClick={closeMobileNavigation} className={config.rootClassName}>
      <div className={config.iconClassName} style={config.style}>
        <Sparkles className={config.glyphClassName} />
      </div>

      <span className={config.labelClassName}>
        <>{texts.brand.prefix}</>

        <span className="gradient-text">{texts.brand.accent}</span>
      </span>
    </Link>
  );
}
