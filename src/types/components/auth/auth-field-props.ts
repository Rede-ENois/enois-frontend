import type { ReactNode } from "react";

export type AuthFieldProps = {
  label: string;
  error?: string;
  right?: ReactNode;
  children: ReactNode;
};
