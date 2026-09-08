import { useContext } from "react";

import { RegisterMentorDialogContext } from "@/utils/components/mentoring/register-mentor-dialog-context";

export function useRegisterMentorDialogContext() {
  const context = useContext(RegisterMentorDialogContext);

  if (!context) {
    throw new Error(
      "Register mentor dialog components must be rendered inside RegisterMentorDialogProvider",
    );
  }

  return context;
}
