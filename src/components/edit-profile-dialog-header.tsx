import { texts } from "@/texts";
import type { EditProfileDialogHeaderProps } from "@/types/components/profile/edit-profile-dialog/edit-profile-dialog-header-props";

import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

export function EditProfileDialogHeader({
  tabs,
  onCancel,
  onSave,
  isSaving,
}: EditProfileDialogHeaderProps) {
  return (
    <DialogHeader className="sticky top-0 z-10 border-b border-border-soft bg-surface-card px-6 pb-4 pt-6">
      <div className="flex items-center justify-between">
        <DialogTitle className="text-[18px] font-light text-text-strong">
          {texts.profile.edit.title}
        </DialogTitle>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            {texts.common.cancel}
          </Button>

          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? texts.common.saving : texts.common.save}
          </Button>
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
