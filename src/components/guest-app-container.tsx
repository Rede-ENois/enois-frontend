import type { WithRequiredChildren } from "@/types/components/with-required-children";

import { GuestAppHeader } from "./guest-app-header";

export function GuestAppContainer({ children }: WithRequiredChildren) {
  return (
    <div className="min-h-screen bg-background">
      <GuestAppHeader />

      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:pb-6">
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
