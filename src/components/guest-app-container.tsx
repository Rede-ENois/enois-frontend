import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { AppLayout } from "@rede-enois/design-system/patterns";

import { GuestAppHeader } from "./guest-app-header";

export function GuestAppContainer({ children }: WithRequiredChildren) {
  return (
    <AppLayout>
      <AppLayout.Header>
        <GuestAppHeader />
      </AppLayout.Header>

      <AppLayout.Content>
        <AppLayout.Main>{children}</AppLayout.Main>
      </AppLayout.Content>
    </AppLayout>
  );
}
