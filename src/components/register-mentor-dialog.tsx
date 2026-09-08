import { texts } from "@/texts";
import { useRegisterMentorDialogContext } from "@/utils/components/mentoring/use-register-mentor-dialog-context";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { RegisterMentorForm } from "@/components/register-mentor-form";
import { RegisterMentorTrigger } from "@/components/register-mentor-trigger";

export function RegisterMentorDialog() {
  const { open, setOpen } = useRegisterMentorDialogContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <RegisterMentorTrigger />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.mentoring.becomeMentorTitle}</DialogTitle>
        </DialogHeader>

        <RegisterMentorForm />
      </DialogContent>
    </Dialog>
  );
}
