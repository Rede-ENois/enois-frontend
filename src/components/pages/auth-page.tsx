import { AuthFormPanel } from "@/components/auth/auth-form-panel";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import { AuthModeTabs } from "@/components/auth/auth-mode-tabs";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export function Auth() {
  return (
    <AuthPageLayout showThemeToggle>
      <AuthModeTabs />
      <AuthFormPanel />
      <AuthLegalNotice />
    </AuthPageLayout>
  );
}
