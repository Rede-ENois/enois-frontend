import type { SubListEditorFormProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-form-props";

import { SubListCurrentlyHereToggle } from "@/components/sub-list-currently-here-toggle";
import { SubListEditorActions } from "@/components/sub-list-editor-actions";
import { SubListEditorField } from "@/components/sub-list-editor-field";

export function SubListEditorForm({ fields, currentlyHere, actions }: SubListEditorFormProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border-soft p-4">
      {fields.map((field) => (
        <SubListEditorField key={field.fieldKey} {...field} />
      ))}

      {currentlyHere && <SubListCurrentlyHereToggle {...currentlyHere} />}

      <SubListEditorActions {...actions} />
    </div>
  );
}
