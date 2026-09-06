import type { EditProfileFieldProps } from "@/types/components/profile/edit/edit-profile-field-props";

import { Label } from "@/components/ui/label";

export function EditProfileField({ label, error, children }: EditProfileFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
