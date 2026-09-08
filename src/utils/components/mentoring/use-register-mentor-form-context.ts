import { useContext } from "react";

import { RegisterMentorFormContext } from "@/utils/components/mentoring/register-mentor-form-context";

export function useRegisterMentorFormContext() {
  const context = useContext(RegisterMentorFormContext);

  if (!context) {
    throw new Error(
      "Register mentor form components must be rendered inside RegisterMentorDialogProvider",
    );
  }

  return context;
}
