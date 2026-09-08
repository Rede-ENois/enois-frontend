import { texts } from "@/texts";
import type { EditProfileInfoFormProps } from "@/types/components/profile/edit-profile-info-form-props";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

const fieldLabelClassName = "text-[13px] font-light text-text-subtle";

export function EditProfileInfoFields({
  values,
  usernameError,
  setField,
  setUsername,
}: EditProfileInfoFormProps) {
  const fieldRows = [
    [
      {
        key: "name",
        label: texts.profile.edit.fields.name,
        value: values.name,
        placeholder: undefined,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("name", value),
      },
    ],
    [
      {
        key: "username",
        label: texts.profile.edit.fields.username,
        value: values.username,
        placeholder: texts.profile.edit.placeholders.username,
        error: usernameError,
        control: "input",
        onChange: setUsername,
      },
    ],
    [
      {
        key: "headline",
        label: texts.profile.edit.fields.headline,
        value: values.headline,
        placeholder: texts.profile.edit.placeholders.headline,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("headline", value),
      },
    ],
    [
      {
        key: "bio",
        label: texts.profile.edit.fields.bio,
        value: values.bio,
        placeholder: undefined,
        error: undefined,
        control: "textarea",
        onChange: (value: string) => setField("bio", value),
      },
    ],
    [
      {
        key: "company",
        label: texts.profile.edit.fields.company,
        value: values.company,
        placeholder: undefined,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("company", value),
      },
      {
        key: "location",
        label: texts.profile.edit.fields.location,
        value: values.location,
        placeholder: undefined,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("location", value),
      },
    ],
    [
      {
        key: "availability",
        label: texts.profile.edit.fields.availability,
        value: values.availability,
        placeholder: texts.profile.edit.placeholders.availability,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("availability", value),
      },
    ],
    [
      {
        key: "portfolio",
        label: texts.profile.edit.fields.portfolio,
        value: values.portfolio,
        placeholder: texts.profile.edit.placeholders.portfolio,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("portfolio", value),
      },
    ],
    [
      {
        key: "external-links",
        label: texts.profile.edit.fields.externalLinks,
        value: values.linksText,
        placeholder: undefined,
        error: undefined,
        control: "textarea",
        onChange: (value: string) => setField("linksText", value),
      },
    ],
    [
      {
        key: "skills",
        label: texts.profile.edit.fields.skills,
        value: values.skillsText,
        placeholder: undefined,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("skillsText", value),
      },
    ],
    [
      {
        key: "goals",
        label: texts.profile.edit.fields.goals,
        value: values.goalsText,
        placeholder: undefined,
        error: undefined,
        control: "input",
        onChange: (value: string) => setField("goalsText", value),
      },
    ],
  ];

  const renderField = (field: (typeof fieldRows)[number][number]) => (
    <FormField
      key={field.key}
      label={field.label}
      error={field.error}
      labelClassName={fieldLabelClassName}
    >
      {field.control === "textarea" ? (
        <Textarea
          value={field.value}
          onChange={(event) => field.onChange(event.target.value)}
          rows={3}
          className={`h-10 border-border-soft bg-surface-1${field.key === "bio" ? " pl-9" : ""}`}
        />
      ) : (
        <Input
          value={field.value}
          onChange={(event) => field.onChange(event.target.value)}
          placeholder={field.placeholder}
          className="h-10 border-border-soft bg-surface-1"
        />
      )}
    </FormField>
  );

  return (
    <div className="space-y-5">
      {fieldRows.map((row) =>
        row.length === 1 ? (
          row.map(renderField)
        ) : (
          <div key={row.map((field) => field.key).join("-")} className="grid gap-4 sm:grid-cols-2">
            {row.map(renderField)}
          </div>
        ),
      )}
    </div>
  );
}
