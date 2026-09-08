import { texts } from "@/texts";
import { useEditProfileDialogContext } from "@/utils/components/profile/use-edit-profile-dialog-context";

import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

export function EditProfileDialogHeader() {
  const { tabs, close, profileInfo } = useEditProfileDialogContext();
  const actions = [
    {
      key: "cancel",
      label: texts.common.cancel,
      variant: "outline" as const,
      onClick: close,
      disabled: false,
    },
    {
      key: "save",
      label: profileInfo.isSaving ? texts.common.saving : texts.common.save,
      variant: "default" as const,
      onClick: profileInfo.save,
      disabled: profileInfo.isSaving,
    },
  ];

  return (
    <DialogHeader className="sticky top-0 z-10 border-b border-border-soft bg-surface-card px-6 pb-4 pt-6">
      <div className="flex items-center justify-between">
        <DialogTitle className="text-[18px] font-light text-text-strong">
          {texts.profile.edit.title}
        </DialogTitle>

        <div className="flex items-center gap-2">
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
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto text-sm">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={item.select}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-light transition ${
              item.selected
                ? "bg-surface-2 text-primary"
                : "text-text-subtle hover:bg-surface-3 hover:text-text-strong"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </DialogHeader>
  );
}
