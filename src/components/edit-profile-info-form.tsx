import { texts } from "@/texts";
import type { EditProfileInfoFormProps } from "@/types/components/profile/edit-profile-info-form-props";

import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const fieldLabelClassName = "text-[13px] font-light text-text-subtle";

export function EditProfileInfoForm({
  values,
  usernameError,
  setField,
  clearUsernameError,
}: EditProfileInfoFormProps) {
  return (
    <div className="space-y-5">
      <FormField label={texts.profile.edit.fields.name} labelClassName={fieldLabelClassName}>
        <Input
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <FormField
        label={texts.profile.edit.fields.username}
        error={usernameError}
        labelClassName={fieldLabelClassName}
      >
        <Input
          value={values.username}
          onChange={(event) => {
            setField("username", event.target.value);
            clearUsernameError();
          }}
          placeholder={texts.profile.edit.placeholders.username}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <FormField label={texts.profile.edit.fields.headline} labelClassName={fieldLabelClassName}>
        <Input
          value={values.headline}
          onChange={(event) => setField("headline", event.target.value)}
          placeholder={texts.profile.edit.placeholders.headline}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <FormField label={texts.profile.edit.fields.bio} labelClassName={fieldLabelClassName}>
        <Textarea
          value={values.bio}
          onChange={(event) => setField("bio", event.target.value)}
          rows={3}
          className="h-10 border-border-soft bg-surface-1 pl-9"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={texts.profile.edit.fields.company} labelClassName={fieldLabelClassName}>
          <Input
            value={values.company}
            onChange={(event) => setField("company", event.target.value)}
            className="h-10 border-border-soft bg-surface-1"
          />
        </FormField>
        <FormField label={texts.profile.edit.fields.location} labelClassName={fieldLabelClassName}>
          <Input
            value={values.location}
            onChange={(event) => setField("location", event.target.value)}
            className="h-10 border-border-soft bg-surface-1"
          />
        </FormField>
      </div>

      <FormField label={texts.profile.edit.fields.availability} labelClassName={fieldLabelClassName}>
        <Input
          value={values.availability}
          onChange={(event) => setField("availability", event.target.value)}
          placeholder={texts.profile.edit.placeholders.availability}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <FormField label={texts.profile.edit.fields.portfolio} labelClassName={fieldLabelClassName}>
        <Input
          value={values.portfolio}
          onChange={(event) => setField("portfolio", event.target.value)}
          placeholder={texts.profile.edit.placeholders.portfolio}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <FormField label={texts.profile.edit.fields.externalLinks} labelClassName={fieldLabelClassName}>
        <Textarea
          value={values.linksText}
          onChange={(event) => setField("linksText", event.target.value)}
          rows={3}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <FormField label={texts.profile.edit.fields.skills} labelClassName={fieldLabelClassName}>
        <Input
          value={values.skillsText}
          onChange={(event) => setField("skillsText", event.target.value)}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <FormField label={texts.profile.edit.fields.goals} labelClassName={fieldLabelClassName}>
        <Input
          value={values.goalsText}
          onChange={(event) => setField("goalsText", event.target.value)}
          className="h-10 border-border-soft bg-surface-1"
        />
      </FormField>

      <div className="flex items-center gap-8">
        <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
          <Switch
            checked={values.openToWork}
            onCheckedChange={(checked) => setField("openToWork", checked)}
          />
          <>{texts.profile.edit.openToWork}</>
        </label>
        <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
          <Switch
            checked={values.isMentor}
            onCheckedChange={(checked) => setField("isMentor", checked)}
          />
          <>{texts.profile.edit.mentorAvailable}</>
        </label>
      </div>
    </div>
  );
}
