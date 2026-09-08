import type { ReactNode } from "react";

export type AuthSocialProvider = {
  key: string;
  action: () => void;
  loading: boolean;
  icon: ReactNode;
  label: string;
};
