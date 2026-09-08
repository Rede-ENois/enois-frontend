import { texts } from "@/texts";
import { useSignupFormController } from "@/utils/components/auth/use-signup-form-controller";

import { ErrorBanner } from "@/components/error-banner";

import { AuthFormHeading } from "./auth-form-heading";
import { AuthSocialOptions } from "./auth-social-options";
import { AuthSubmitButton } from "./auth-submit-button";
import { SignupFormFields } from "./signup-form-fields";

export function SignupForm() {
  const { errors, formError, loading, submit } = useSignupFormController();

  return (
    <div>
      <AuthFormHeading title={texts.auth.signup.title} subtitle={texts.auth.signup.subtitle} />

      <div className="mt-6">
        <AuthSocialOptions />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <SignupFormFields errors={errors} />
        {formError !== null && <ErrorBanner error={formError} />}
        <AuthSubmitButton loading={loading} label={texts.common.createAccount} />
      </form>
    </div>
  );
}
