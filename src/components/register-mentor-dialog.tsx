import { texts } from "@/texts";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { useRegisterMentorDialogController } from "@/utils/components/mentoring/use-register-mentor-dialog-controller";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { RegisterMentorForm } from "@/components/register-mentor-form";
import { RegisterMentorTrigger } from "@/components/register-mentor-trigger";

export function RegisterMentorDialog() {
  const controller = useRegisterMentorDialogController();

  return (
    <Dialog open={controller.open} onOpenChange={controller.setOpen}>
      <DialogTrigger asChild>
        <RegisterMentorTrigger />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.mentoring.becomeMentorTitle}</DialogTitle>
        </DialogHeader>

        <RegisterMentorForm
          skillsText={controller.skillsText}
          setSkillsText={controller.setSkillsText}
          price={controller.price}
          setPrice={controller.setPrice}
          saving={controller.saving}
          saveDisabled={controller.saveDisabled}
          save={controller.save}
        />
      </DialogContent>
    </Dialog>
  );
}
