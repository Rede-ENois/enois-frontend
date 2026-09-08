import { texts } from "@/texts";
import type { AuthModeTab } from "@/types/components/auth/auth-mode-tab";
import type { AuthModeTabsProps } from "@/types/components/auth/auth-mode-tabs-props";

export function createAuthModeTabs({
  signupActive,
  loginActive,
  onSelectSignup,
  onSelectLogin,
}: AuthModeTabsProps): AuthModeTab[] {
  return [
    {
      key: "signup",
      active: signupActive,
      onClick: onSelectSignup,
      label: texts.common.createAccount,
    },
    {
      key: "login",
      active: loginActive,
      onClick: onSelectLogin,
      label: texts.common.enter,
    },
  ];
}
