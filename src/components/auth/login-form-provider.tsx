import { LoginFormContext } from "@/utils/components/auth/login-form-context";
import { useLoginFormController } from "@/utils/components/auth/use-login-form-controller";

import { LoginForm } from "@/components/auth/login-form";

export function LoginFormProvider() {
  const controller = useLoginFormController();

  return (
    <LoginFormContext.Provider value={controller}>
      <LoginForm />
    </LoginFormContext.Provider>
  );
}
