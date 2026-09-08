import type { ComponentProps } from "react";

import { useAuthPasswordInputController } from "@/utils/auth/use-auth-password-input-controller";

import { Input } from "@/components/ui/input";

export function AuthPasswordInput(props: ComponentProps<typeof Input>) {
  const { inputType, Icon, label, toggle } = useAuthPasswordInputController();

  return (
    <div className="relative">
      <Input {...props} type={inputType} />

      <button
        type="button"
        onClick={toggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
        aria-label={label}
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
