import { texts } from "@/texts";
import type { EditProfileInfoSectionProps } from "@/types/components/profile/edit/edit-profile-info";

import { Input } from "@/components/ui/input";
import { EditProfileField } from "./edit-profile-field";

export function EditProfileWorkFields({ values, onChange }: EditProfileInfoSectionProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <EditProfileField label={texts.profile.edit.fields.company}>
          <Input value={values.company} onChange={(event) => onChange("company", event.target.value)} className="h-10 border-border-soft bg-surface-1" />
        </EditProfileField>
        <EditProfileField label={texts.profile.edit.fields.location}>
          <Input value={values.location} onChange={(event) => onChange("location", event.target.value)} className="h-10 border-border-soft bg-surface-1" />
        </EditProfileField>
      </div>
      <EditProfileField label={texts.profile.edit.fields.availability}>
        <Input value={values.availability} onChange={(event) => onChange("availability", event.target.value)} placeholder={texts.profile.edit.placeholders.availability} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
      <EditProfileField label={texts.profile.edit.fields.portfolio}>
        <Input value={values.portfolio} onChange={(event) => onChange("portfolio", event.target.value)} placeholder={texts.profile.edit.placeholders.portfolio} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
    </>
  );
}
