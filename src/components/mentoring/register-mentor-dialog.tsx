import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RegisterMentorForm, type RegisterMentorFormValues } from "./register-mentor-form";

type RegisterMentorDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRegister: (values: RegisterMentorFormValues) => void;
};

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
