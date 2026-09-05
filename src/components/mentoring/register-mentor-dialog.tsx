import { texts } from "@/texts";

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
  open,
  pending,
  onOpenChange,
  onRegister,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (data: { expertise: string[]; price: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          {texts.mentoring.becomeMentor}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.mentoring.becomeMentorTitle}</DialogTitle>
        </DialogHeader>
        <RegisterMentorForm onSave={onRegister} isPending={pending} />
      </DialogContent>
    </Dialog>
  );
}
