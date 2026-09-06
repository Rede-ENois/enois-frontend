import type { PropsWithChildren } from "react";

import { Label } from "@/components/ui/label";

export function ProfileEntryFormField({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
    </div>
  );
}
