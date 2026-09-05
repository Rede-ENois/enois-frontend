import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export function Field({
  label,
  error,
  right,
  children,
}: {
  label: string;
  error?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
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
