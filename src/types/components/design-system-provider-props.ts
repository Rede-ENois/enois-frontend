import type { ReactNode } from "react";

export type DesignSystemProviderProps = {
  children: ReactNode;
  /** Replaces the media resolver for a subtree (the badge editors draw official badge ids). */
  resolveMediaUrl?: (url: string | null | undefined) => string | undefined;
};
