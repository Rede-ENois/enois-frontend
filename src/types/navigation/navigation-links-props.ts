import type { ComponentPropsWithoutRef } from "react";

export type NavigationLinksProps = Pick<ComponentPropsWithoutRef<"nav">, "className"> & {
  variant: "sidebar" | "drawer";
};
