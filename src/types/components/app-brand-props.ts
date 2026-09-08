import type { APP_BRAND_VARIANTS } from "@/constants/app-brand-variants";

export type AppBrandProps = {
  variant?: keyof typeof APP_BRAND_VARIANTS;
};
