import { texts } from "@/texts";
import type { AuthModeTabsProps } from "@/types/components/auth/auth-mode-tabs-props";

import { TabButton } from "@/components/tab-button";

export function AuthModeTabs({
  signupActive,
  loginActive,
  onSelectSignup,
  onSelectLogin,
}: AuthModeTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <TabButton variant="auth" active={signupActive} onClick={onSelectSignup}>
        {texts.common.createAccount}
      </TabButton>

      <TabButton variant="auth" active={loginActive} onClick={onSelectLogin}>
        {texts.common.enter}
      </TabButton>
    </div>
  );
}
