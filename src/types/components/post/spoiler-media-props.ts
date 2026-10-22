import type { ReactNode } from "react";

export type SpoilerMediaProps = {
  active?: boolean;
  label: string;
  children: (revealed: boolean) => ReactNode;
};
