import { texts } from "@/texts";
import type { EditProfileDiscoveryFieldsProps } from "@/types/components/profile/edit/edit-profile-discovery-fields-props";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditProfileField } from "./edit-profile-field";

export function EditProfileDiscoveryFields({ values, onChange }: EditProfileDiscoveryFieldsProps) {
  return (
    <>
      <EditProfileField label={texts.profile.edit.fields.externalLinks}>
        <Textarea value={values.linksText} onChange={(event) => onChange("linksText", event.target.value)} rows={3} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
      <EditProfileField label={texts.profile.edit.fields.skills}>
        <Input value={values.skillsText} onChange={(event) => onChange("skillsText", event.target.value)} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
      <EditProfileField label={texts.profile.edit.fields.goals}>
        <Input value={values.goalsText} onChange={(event) => onChange("goalsText", event.target.value)} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
    </>
  );
}
