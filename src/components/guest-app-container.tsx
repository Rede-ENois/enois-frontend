import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { AppLayout } from "@rede-enois/design-system/patterns";

import { GuestAppHeader } from "./guest-app-header";
import { AdminNoticeBanner } from "./notices/admin-notice";

export function GuestAppContainer({ children }: WithRequiredChildren) {
  return (
    <AppLayout>
      <AppLayout.Header>
        <GuestAppHeader />
      </AppLayout.Header>

      <AdminNoticeBanner />

      <AppLayout.Content>
        <AppLayout.Main>{children}</AppLayout.Main>
      </AppLayout.Content>
    </AppLayout>
  );
}
