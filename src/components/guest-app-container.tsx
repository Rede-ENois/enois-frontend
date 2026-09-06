import type { GuestAppContainerProps } from "@/types/components/app/guest-app-container-props";

import { GuestAppHeader } from "./guest-app-header";
import { AppLayout } from "./app-layout";

export function GuestAppContainer({ children }: GuestAppContainerProps) {
  return (
    <AppLayout>
      <AppLayout.Header><GuestAppHeader /></AppLayout.Header>
      <AppLayout.Content><AppLayout.Main>{children}</AppLayout.Main></AppLayout.Content>
    </AppLayout>
  );
}
