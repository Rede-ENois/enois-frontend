import type { PropsWithChildren } from "react";

import { GuestAppHeader } from "./guest-app-header";
import { AppLayout } from "./app-layout";

export function GuestAppContainer({ children }: PropsWithChildren) {
  return (
    <AppLayout>
      <AppLayout.Header><GuestAppHeader /></AppLayout.Header>
      <AppLayout.Content><AppLayout.Main>{children}</AppLayout.Main></AppLayout.Content>
    </AppLayout>
  );
}
