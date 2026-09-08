import type { SubListEditorFieldProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-field-props";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

export function SubListEditorField({
  label,
  multiline,
  type,
  value,
  onChange,
}: SubListEditorFieldProps) {
  return (
    <FormField label={label} labelClassName="text-[13px] font-light text-text-subtle">
      {multiline ? (
        <Textarea
          value={value}
          onChange={onChange}
          rows={2}
          className="h-10 border-border-soft bg-surface-1"
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={onChange}
          className="h-10 border-border-soft bg-surface-1"
        />
      )}
    </FormField>
  );
}
