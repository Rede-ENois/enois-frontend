import type { SubListEditorFormProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-form-props";

import { SubListCurrentlyHereToggle } from "@/components/sub-list-currently-here-toggle";
import { SubListEditorActions } from "@/components/sub-list-editor-actions";
import { SubListEditorField } from "@/components/sub-list-editor-field";

export function SubListEditorForm(props: SubListEditorFormProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border-soft p-4">
      {props.fields.map((field) => (
        <SubListEditorField
          key={field.key}
          field={field}
          value={props.form[field.key] ?? ""}
          onChange={(value) => props.onFieldChange(field.key, value)}
        />
      ))}

      {props.showCurrentlyHere && (
        <SubListCurrentlyHereToggle
          checked={props.currentlyHere}
          onCheckedChange={props.onCurrentlyHereChange}
        />
      )}

      <SubListEditorActions
        isPending={props.isPending}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
      />
    </div>
  );
}
