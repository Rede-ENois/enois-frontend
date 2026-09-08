import { SignupFormContext } from "@/utils/components/auth/signup-form-context";
import { useSignupFormController } from "@/utils/components/auth/use-signup-form-controller";

import { SignupForm } from "@/components/auth/signup-form";

export function SignupFormProvider() {
  const controller = useSignupFormController();

  return (
    <SignupFormContext.Provider value={controller}>
      <SignupForm />
    </SignupFormContext.Provider>
  );
}
