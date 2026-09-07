import type { ComponentProps } from "react";

import type { APP_BRAND_VARIANTS } from "@/constants/app-brand-variants";

export type AppBrandProps = Pick<ComponentProps<"a">, "onClick"> & {
  variant?: keyof typeof APP_BRAND_VARIANTS;
};
