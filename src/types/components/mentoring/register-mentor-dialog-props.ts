import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";

export type RegisterMentorDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRegister: (values: CreateMentorInput) => void;
};
