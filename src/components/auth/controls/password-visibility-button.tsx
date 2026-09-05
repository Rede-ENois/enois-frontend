import { Eye, EyeOff } from "lucide-react";

import { texts } from "@/texts";

export function PasswordVisibilityButton({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  const Icon = show ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
      aria-label={show ? texts.auth.password.hide : texts.auth.password.show}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
