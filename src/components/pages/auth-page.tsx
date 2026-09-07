import { useAuthPageController } from "@/utils/components/auth/use-auth-page-controller";

import { AuthFormPanel } from "@/components/auth/auth-form-panel";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import { AuthModeTabs } from "@/components/auth/auth-mode-tabs";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";

export function Auth() {
  const auth = useAuthPageController();

  return (
    <AuthPageLayout showThemeToggle>
      <AuthModeTabs
        signupActive={auth.signupTabActive}
        loginActive={auth.loginTabActive}
        onSelectSignup={auth.selectSignup}
        onSelectLogin={auth.selectLogin}
      />
      <AuthFormPanel
        showSignup={auth.showSignup}
        onDone={auth.finishAuth}
        onForgot={auth.openForgot}
      />
      <ForgotPasswordDialog open={auth.forgotOpen} onOpenChange={auth.setForgotOpen} />
      <AuthLegalNotice />
    </AuthPageLayout>
  );
}
