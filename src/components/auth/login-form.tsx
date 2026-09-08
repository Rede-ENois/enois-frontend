import { texts } from "@/texts";

import { useLoginFormController } from "@/utils/components/auth/use-login-form-controller";

import { ErrorBanner } from "@/components/error-banner";

import { AuthFormHeading } from "./auth-form-heading";
import { AuthSocialOptions } from "./auth-social-options";
import { AuthSubmitButton } from "./auth-submit-button";
import { LoginFormFields } from "./login-form-fields";

export function LoginForm() {
  const { errors, formError, loading, submit } = useLoginFormController();

  return (
    <div>
      <AuthFormHeading title={texts.auth.login.title} subtitle={texts.auth.login.subtitle} />

      <div className="mt-6">
        <AuthSocialOptions />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <LoginFormFields errors={errors} />
        {formError !== null && <ErrorBanner error={formError} />}
        <AuthSubmitButton loading={loading} label={texts.common.enter} />
      </form>
    </div>
  );
}
