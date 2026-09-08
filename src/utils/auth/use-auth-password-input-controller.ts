import { useState } from "react";

import { texts } from "@/texts";
import { Eye, EyeOff } from "lucide-react";

export function useAuthPasswordInputController() {
  const [show, setShow] = useState(false);

  return {
    inputType: show ? ("text" as const) : ("password" as const),
    Icon: show ? EyeOff : Eye,
    label: show ? texts.auth.password.hide : texts.auth.password.show,
    toggle: () => setShow((value) => !value),
  };
}
