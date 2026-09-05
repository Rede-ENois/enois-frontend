import type { ReactNode } from "react";

import { texts } from "@/texts";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type EditProfileInfoValues = {
  username: string;
  name: string;
  headline: string;
  bio: string;
  company: string;
  location: string;
  availability: string;
  portfolio: string;
  linksText: string;
  skillsText: string;
  goalsText: string;
  openToWork: boolean;
  isMentor: boolean;
};

type EditProfileInfoFormProps = {
  values: EditProfileInfoValues;
  usernameError: string;
  onChange: <K extends keyof EditProfileInfoValues>(
    field: K,
    value: EditProfileInfoValues[K],
  ) => void;
};

export function EditProfileInfoForm({
  values,
  usernameError,
  onChange,
}: EditProfileInfoFormProps) {
  return (
    <div className="space-y-5">
      <Field label={texts.profile.edit.fields.name}>
        <Input
          value={values.name}
          onChange={(event) => onChange("name", event.target.value)}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <Field label={texts.profile.edit.fields.username} error={usernameError}>
        <Input
          value={values.username}
          onChange={(event) => onChange("username", event.target.value)}
          placeholder={texts.profile.edit.placeholders.username}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <Field label={texts.profile.edit.fields.headline}>
        <Input
          value={values.headline}
          onChange={(event) => onChange("headline", event.target.value)}
          placeholder={texts.profile.edit.placeholders.headline}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <Field label={texts.profile.edit.fields.bio}>
        <Textarea
          value={values.bio}
          onChange={(event) => onChange("bio", event.target.value)}
          rows={3}
          className="h-10 border-border-soft bg-surface-1 pl-9"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={texts.profile.edit.fields.company}>
          <Input
            value={values.company}
            onChange={(event) => onChange("company", event.target.value)}
            className="h-10 border-border-soft bg-surface-1"
          />
        </Field>
        <Field label={texts.profile.edit.fields.location}>
          <Input
            value={values.location}
            onChange={(event) => onChange("location", event.target.value)}
            className="h-10 border-border-soft bg-surface-1"
          />
        </Field>
      </div>

      <Field label={texts.profile.edit.fields.availability}>
        <Input
          value={values.availability}
          onChange={(event) => onChange("availability", event.target.value)}
          placeholder={texts.profile.edit.placeholders.availability}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <Field label={texts.profile.edit.fields.portfolio}>
        <Input
          value={values.portfolio}
          onChange={(event) => onChange("portfolio", event.target.value)}
          placeholder={texts.profile.edit.placeholders.portfolio}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <Field label={texts.profile.edit.fields.externalLinks}>
        <Textarea
          value={values.linksText}
          onChange={(event) => onChange("linksText", event.target.value)}
          rows={3}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <Field label={texts.profile.edit.fields.skills}>
        <Input
          value={values.skillsText}
          onChange={(event) => onChange("skillsText", event.target.value)}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <Field label={texts.profile.edit.fields.goals}>
        <Input
          value={values.goalsText}
          onChange={(event) => onChange("goalsText", event.target.value)}
          className="h-10 border-border-soft bg-surface-1"
        />
      </Field>

      <div className="flex items-center gap-8">
        <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
          <Switch
            checked={values.openToWork}
            onCheckedChange={(value) => onChange("openToWork", value)}
          />
          {texts.profile.edit.openToWork}
        </label>
        <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
          <Switch checked={values.isMentor} onCheckedChange={(value) => onChange("isMentor", value)} />
          {texts.profile.edit.mentorAvailable}
        </label>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-light text-text-subtle">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
