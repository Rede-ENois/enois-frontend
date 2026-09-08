import type { SubListEditorFieldProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-field-props";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

export function SubListEditorField({ field, value, onChange }: SubListEditorFieldProps) {
  return (
    <FormField label={field.label} labelClassName="text-[13px] font-light text-text-subtle">
      {field.multiline ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          className="h-10 border-border-soft bg-surface-1"
        />
      ) : (
        <Input
          type={field.type ?? "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 border-border-soft bg-surface-1"
        />
      )}
    </FormField>
  );
}
