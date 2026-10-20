import * as React from "react";

import { cn } from "@/lib/utils";

import { CharCounter } from "./char-counter";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, maxLength, value, defaultValue, onChange, ...props }, ref) => {
    // Campos nao controlados (formularios que leem FormData) nao tem `value`: o comprimento e
    // rastreado aqui, senao o contador ficaria parado no total.
    const [length, setLength] = React.useState(String(value ?? defaultValue ?? "").length);
    React.useEffect(() => {
      if (value !== undefined) setLength(String(value ?? "").length);
    }, [value]);
    return (
      <div className="w-full">
        <input
          type={type}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => {
            setLength(event.target.value.length);
            onChange?.(event);
          }}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
Input.displayName = "Input";

export { Input };
