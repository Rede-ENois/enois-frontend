import type { WithRequiredChildren } from "@/types/components/with-required-children";

export function AppLayoutMain({ children }: WithRequiredChildren) {
  return <main className="min-w-0 flex-1">{children}</main>;
}
