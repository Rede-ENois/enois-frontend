import type { ReactNode } from "react";

export type AuthTabButtonProps = {
  isActive: boolean;
  children: ReactNode;
  onClick: () => void;
};
