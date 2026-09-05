import { texts } from "@/texts";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditProfileField } from "./edit-profile-field";
import type { EditProfileInfoChange, EditProfileInfoValues } from "../edit-profile-info-types";

export function EditProfilePrimaryFields({ values, usernameError, onChange }: {
  values: EditProfileInfoValues;
  usernameError: string;
  onChange: EditProfileInfoChange;
}) {
  return (
    <>
      <EditProfileField label={texts.profile.edit.fields.name}>
        <Input value={values.name} onChange={(event) => onChange("name", event.target.value)} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
      <EditProfileField label={texts.profile.edit.fields.username} error={usernameError}>
        <Input value={values.username} onChange={(event) => onChange("username", event.target.value)} placeholder={texts.profile.edit.placeholders.username} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
      <EditProfileField label={texts.profile.edit.fields.headline}>
        <Input value={values.headline} onChange={(event) => onChange("headline", event.target.value)} placeholder={texts.profile.edit.placeholders.headline} className="h-10 border-border-soft bg-surface-1" />
      </EditProfileField>
      <EditProfileField label={texts.profile.edit.fields.bio}>
        <Textarea value={values.bio} onChange={(event) => onChange("bio", event.target.value)} rows={3} className="h-10 border-border-soft bg-surface-1 pl-9" />
      </EditProfileField>
    </>
  );
}
