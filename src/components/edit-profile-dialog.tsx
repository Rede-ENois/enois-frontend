import { useState } from "react";

import { EDIT_PROFILE_TABS } from "@/constants/edit-profile-tabs";
import { texts } from "@/texts";
import type { Props } from "@/types/components/profile/edit-profile-dialog/props";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { useEditProfileInfo } from "@/lib/use-edit-profile-info";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { EditProfileCertifications } from "@/components/edit-profile-certifications";
import { EditProfileEducation } from "@/components/edit-profile-education";
import { EditProfileExperiences } from "@/components/edit-profile-experiences";
import { EditProfileInfoForm } from "@/components/edit-profile-info-form";

export function EditProfileDialog({ profile, children }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<(typeof EDIT_PROFILE_TABS)[number]["key"]>("info");
  const profileInfo = useEditProfileInfo(profile, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b border-border-soft bg-surface-card px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-light text-text-strong">
              {texts.profile.edit.title}
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                {texts.common.cancel}
              </Button>

              <Button size="sm" onClick={profileInfo.save} disabled={profileInfo.isSaving}>
                {profileInfo.isSaving ? texts.common.saving : texts.common.save}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto text-sm">
            {EDIT_PROFILE_TABS.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-light transition ${
                  tab === item.key
                    ? "bg-surface-2 text-primary"
                    : "text-text-subtle hover:bg-surface-3 hover:text-text-strong"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6 pt-4">
          {tab === "info" && (
            <EditProfileInfoForm
              values={profileInfo.values}
              usernameError={profileInfo.usernameError}
              setField={profileInfo.setField}
              clearUsernameError={profileInfo.clearUsernameError}
            />
          )}
          {tab === "experiences" && <EditProfileExperiences />}
          {tab === "education" && <EditProfileEducation />}
          {tab === "certifications" && <EditProfileCertifications />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
