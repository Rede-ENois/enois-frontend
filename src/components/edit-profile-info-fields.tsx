import { EDIT_PROFILE_FIELD_LABEL_CLASS_NAME } from "@/constants/edit-profile-field-label-class-name";
import { EDIT_PROFILE_INFO_FIELD_ROWS } from "@/constants/edit-profile-info-field-rows";
import type { EditProfileInfoFormProps } from "@/types/components/profile/edit-profile-info-form-props";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

export function EditProfileInfoFields({
  values,
  usernameError,
  setField,
  setUsername,
}: EditProfileInfoFormProps) {
  const renderField = (field: (typeof EDIT_PROFILE_INFO_FIELD_ROWS)[number][number]) => {
    const changeValue = (value: string) => {
      if (field.field === "username") setUsername(value);
      else setField(field.field, value);
    };

    return (
      <FormField
        key={field.key}
        label={field.label}
        error={field.field === "username" ? usernameError : undefined}
        labelClassName={EDIT_PROFILE_FIELD_LABEL_CLASS_NAME}
      >
        {field.control === "textarea" ? (
          <Textarea
            value={values[field.field]}
            onChange={(event) => changeValue(event.target.value)}
            rows={3}
            className={`h-10 border-border-soft bg-surface-1${field.field === "bio" ? " pl-9" : ""}`}
          />
        ) : (
          <Input
            value={values[field.field]}
            onChange={(event) => changeValue(event.target.value)}
            placeholder={field.placeholder}
            className="h-10 border-border-soft bg-surface-1"
          />
        )}
      </FormField>
    );
  };

  return (
    <div className="space-y-5">
      {EDIT_PROFILE_INFO_FIELD_ROWS.map((row) =>
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
