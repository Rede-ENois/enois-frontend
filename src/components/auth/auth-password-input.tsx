import { type ComponentProps, useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { texts } from "@/texts";

import { Input } from "@/components/ui/input";

export function AuthPasswordInput(props: ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
        aria-label={show ? texts.auth.password.hide : texts.auth.password.show}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
