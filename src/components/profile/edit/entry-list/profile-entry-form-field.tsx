import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

type ProfileEntryFormFieldProps = {
  label: string;
  children: ReactNode;
};

export function ProfileEntryFormField({ label, children }: ProfileEntryFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
    </div>
  );
}
