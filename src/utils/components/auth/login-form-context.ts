import { createContext } from "react";

import type { useLoginFormController } from "@/utils/components/auth/use-login-form-controller";

export const LoginFormContext = createContext<ReturnType<typeof useLoginFormController> | null>(
  null,
);
