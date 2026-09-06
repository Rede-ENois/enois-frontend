import type { ReactNode } from "react";

export type SelectableButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};
