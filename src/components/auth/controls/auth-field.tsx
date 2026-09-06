import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

type AuthFieldProps = {
  label: string;
  error?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function AuthField({ label, error, right, children }: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {right}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
