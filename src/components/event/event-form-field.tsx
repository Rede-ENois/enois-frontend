import type { PropsWithChildren } from "react";

import { Label } from "@/components/ui/label";

export function EventFormField({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
