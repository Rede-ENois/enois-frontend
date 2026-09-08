import { createContext } from "react";

import type { useResetPasswordFormController } from "@/utils/components/auth/use-reset-password-form-controller";

export const ResetPasswordFormContext = createContext<
  ReturnType<typeof useResetPasswordFormController> | null
>(null);
