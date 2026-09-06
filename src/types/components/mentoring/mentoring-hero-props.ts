import type { RegisterMentorFormValues } from "./register-mentor-form-values";

export type MentoringHeroProps = {
  isRegistrationOpen: boolean;
  isRegistrationPending: boolean;
  onRegistrationOpenChange: (isOpen: boolean) => void;
  onRegister: (values: RegisterMentorFormValues) => void;
};
