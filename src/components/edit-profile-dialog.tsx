import type { Props } from "@/types/components/profile/edit-profile-dialog/props";
import { useEditProfileDialogController } from "@/utils/components/profile/use-edit-profile-dialog-controller";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";

import { EditProfileDialogBody } from "@/components/edit-profile-dialog-body";
import { EditProfileDialogHeader } from "@/components/edit-profile-dialog-header";

export function EditProfileDialog({ profile, children }: Props) {
  const { open, setOpen, close, activeTab, tabs, profileInfo } =
    useEditProfileDialogController(profile);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <EditProfileDialogHeader
          tabs={tabs}
          onCancel={close}
          onSave={profileInfo.save}
          isSaving={profileInfo.isSaving}
        />
        <EditProfileDialogBody
          activeTab={activeTab}
          profileInfo={{
            values: profileInfo.values,
            usernameError: profileInfo.usernameError,
            setField: profileInfo.setField,
            setUsername: profileInfo.setUsername,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
