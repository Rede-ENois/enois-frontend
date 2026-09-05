import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export function ProfileSubFormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
    </div>
  );
}
