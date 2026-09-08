import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import type { Props } from "@/types/components/profile/edit-profile-dialog/props";
import { useEditProfileDialogContext } from "@/utils/components/profile/use-edit-profile-dialog-context";

import { DialogContent } from "@/components/ui/dialog-content";

import { EditProfileDialogBody } from "@/components/edit-profile-dialog-body";
import { EditProfileDialogHeader } from "@/components/edit-profile-dialog-header";

export function EditProfileDialog({ children }: Props) {
  const { open, setOpen } = useEditProfileDialogContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <EditProfileDialogHeader />
        <EditProfileDialogBody />
      </DialogContent>
    </Dialog>
  );
}
