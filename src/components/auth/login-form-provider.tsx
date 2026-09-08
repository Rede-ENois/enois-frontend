import { LoginFormContext } from "@/utils/auth/login-form-context";
import { useLoginFormController } from "@/utils/auth/use-login-form-controller";

import { LoginForm } from "@/components/auth/login-form";

export function LoginFormProvider() {
  const controller = useLoginFormController();

  return (
    <LoginFormContext.Provider value={controller}>
      <LoginForm />
    </LoginFormContext.Provider>
  );
}
