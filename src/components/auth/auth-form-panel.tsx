import { useAuthFormPanelController } from "@/utils/components/auth/use-auth-form-panel-controller";

import { LoginFormProvider } from "@/components/auth/login-form-provider";
import { SignupFormProvider } from "@/components/auth/signup-form-provider";

export function AuthFormPanel() {
  const { showSignup } = useAuthFormPanelController();

  return <div className="mt-8">{showSignup ? <SignupFormProvider /> : <LoginFormProvider />}</div>;
}
