import type { FieldProps } from "@/types/components/profile/edit-profile-dialog/field-props";

import { Label } from "@/components/ui/label";

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
