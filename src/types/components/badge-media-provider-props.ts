import type { ReactNode } from "react";

export type BadgeMediaProviderProps = {
  /** The badge list on screen: official ids load the SVG renderer only when present. */
  badges: readonly string[];
  children: ReactNode;
};
