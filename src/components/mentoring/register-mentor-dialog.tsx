import { texts } from "@/texts";
import type { RegisterMentorDialogProps } from "@/types/components/mentoring/register-mentor-dialog-props";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RegisterMentorForm } from "./register-mentor-form";

export function RegisterMentorDialog({
  isOpen,
  isPending,
  onOpenChange,
  onRegister,
}: RegisterMentorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          {texts.mentoring.becomeMentor}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.mentoring.becomeMentorTitle}</DialogTitle>
        </DialogHeader>
        <RegisterMentorForm onSave={onRegister} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}
