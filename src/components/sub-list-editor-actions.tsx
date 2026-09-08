import { texts } from "@/texts";
import type { SubListEditorActionsProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-actions-props";

import { Button } from "@/components/ui/button";

export function SubListEditorActions({ isPending, onSubmit, onCancel }: SubListEditorActionsProps) {
  const actions = [
    {
      key: "save",
      label: isPending ? texts.common.saving : texts.common.save,
      variant: "default" as const,
      onClick: onSubmit,
      disabled: isPending,
    },
    {
      key: "cancel",
      label: texts.common.cancel,
      variant: "outline" as const,
      onClick: onCancel,
      disabled: false,
    },
  ];

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <Button
          key={action.key}
          size="sm"
          variant={action.variant}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
