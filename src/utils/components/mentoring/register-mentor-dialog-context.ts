import { createContext } from "react";

import type { useRegisterMentorDialogController } from "@/utils/components/mentoring/use-register-mentor-dialog-controller";

export const RegisterMentorDialogContext = createContext<
  ReturnType<typeof useRegisterMentorDialogController> | null
>(null);
