import { texts } from "@/texts";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditProfileField } from "./edit-profile-field";
import type { EditProfileInfoChange, EditProfileInfoValues } from "../edit-profile-info-types";

export function EditProfileDiscoveryFields({ values, onChange }: {
  values: EditProfileInfoValues;
  onChange: EditProfileInfoChange;
}) {
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
