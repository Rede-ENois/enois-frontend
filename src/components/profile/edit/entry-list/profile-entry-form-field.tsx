import type { FormFieldProps } from "@/types/components/shared/form-field-props";

import { Label } from "@/components/ui/label";

export function ProfileEntryFormField({ label, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
    </div>
  );
}
