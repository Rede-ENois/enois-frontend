import { createContext } from "react";

import type { useRegisterMentorFormController } from "@/utils/components/mentoring/use-register-mentor-form-controller";

export const RegisterMentorFormContext = createContext<ReturnType<
  typeof useRegisterMentorFormController
> | null>(null);
