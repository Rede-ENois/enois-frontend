import type { ReactNode } from "react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type EditProfileTab = "info" | "experiences" | "education" | "certifications";

const tabs: Array<{ key: EditProfileTab; label: string }> = [
  { key: "info", label: texts.profile.edit.tabs.info },
  { key: "experiences", label: texts.profile.edit.tabs.experiences },
  { key: "education", label: texts.profile.edit.tabs.education },
  { key: "certifications", label: texts.profile.edit.tabs.certifications },
];

export function EditProfileShell({ open, trigger, tab, saving, children, onOpenChange, onTabChange, onSave }: {
  open: boolean;
  trigger: ReactNode;
  tab: EditProfileTab;
  saving: boolean;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: EditProfileTab) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b border-border-soft bg-surface-card px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-light text-text-strong">{texts.profile.edit.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>{texts.common.cancel}</Button>
              <Button size="sm" onClick={onSave} disabled={saving}>{saving ? texts.common.saving : texts.common.save}</Button>
            </div>
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto text-sm">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-light transition ${tab === item.key ? "bg-surface-2 text-primary" : "text-text-subtle hover:bg-surface-3 hover:text-text-strong"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </DialogHeader>
        <div className="space-y-6 px-6 pb-6 pt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
