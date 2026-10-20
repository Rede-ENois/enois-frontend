import * as React from "react";

import { cn } from "@/lib/utils";

import { CharCounter } from "./char-counter";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, maxLength, value, defaultValue, onChange, ...props }, ref) => {
    const [length, setLength] = React.useState(String(value ?? defaultValue ?? "").length);
    React.useEffect(() => {
      if (value !== undefined) setLength(String(value ?? "").length);
    }, [value]);
    return (
      <div className="w-full">
        <textarea
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => {
            setLength(event.target.value.length);
            onChange?.(event);
          }}
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          {...props}
        />
        {typeof maxLength === "number" && <CharCounter length={length} max={maxLength} />}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
