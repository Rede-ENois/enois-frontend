import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SpoilerPreviewProps = {
  active?: boolean;
  label: string;
  children: ReactNode;
  className?: string;
};

/** Preview-only spoiler treatment used while composing a post, comment, or message. */
export function SpoilerPreview({
  active = false,
  label,
  children,
  className,
}: SpoilerPreviewProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className={cn("transition duration-300", active && "scale-110 blur-2xl")}>
        {children}
      </div>
      {active && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-bold tracking-wide text-white shadow-lg">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
