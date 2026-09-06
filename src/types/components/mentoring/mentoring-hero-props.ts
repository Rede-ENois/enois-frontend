import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";

export type MentoringHeroProps = {
  isRegistrationOpen: boolean;
  isRegistrationPending: boolean;
  onRegistrationOpenChange: (isOpen: boolean) => void;
  onRegister: (values: CreateMentorInput) => void;
};
