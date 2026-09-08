import { EDIT_PROFILE_FIELD_LABEL_CLASS_NAME } from "@/constants/edit-profile-field-label-class-name";
import { useEditProfileInfoFieldsController } from "@/utils/components/profile/use-edit-profile-info-fields-controller";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

export function EditProfileInfoFields() {
  const { rows } = useEditProfileInfoFieldsController();

  const renderField = (field: (typeof rows)[number][number]) => (
    <FormField
      key={field.key}
      label={field.label}
      error={field.error}
      labelClassName={EDIT_PROFILE_FIELD_LABEL_CLASS_NAME}
    >
      {field.control === "textarea" ? (
        <Textarea
          value={field.value}
          onChange={(event) => field.setValue(event.target.value)}
          rows={3}
          className={field.className}
        />
      ) : (
        <Input
          value={field.value}
          onChange={(event) => field.setValue(event.target.value)}
          placeholder={field.placeholder}
          className={field.className}
        />
      )}
    </FormField>
  );

  return (
    <div className="space-y-5">
      {rows.map((row) =>
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
