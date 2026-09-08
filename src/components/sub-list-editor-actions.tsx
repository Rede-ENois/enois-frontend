import type { SubListEditorActionsProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-actions-props";

import { Button } from "@/components/ui/button";

export function SubListEditorActions({
  saveLabel,
  saveDisabled,
  onSave,
  cancelLabel,
  onCancel,
}: SubListEditorActionsProps) {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={onSave} disabled={saveDisabled}>
        {saveLabel}
      </Button>

      <Button size="sm" variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </div>
  );
}
