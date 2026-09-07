import type { ComponentProps } from "react";

export type AppBrandProps = Pick<ComponentProps<"a">, "onClick"> & {
  variant?: "app" | "auth-desktop" | "auth-mobile";
};
