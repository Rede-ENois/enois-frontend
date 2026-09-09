import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { useAppContainerController } from "@/utils/layout/use-app-container-controller";

import { AuthenticatedAppContainer } from "@/components/layout/authenticated-app-container";
import { GuestAppContainer } from "@/components/layout/guest-app-container";

export function AppContainer({ children }: WithRequiredChildren) {
  const { authenticated } = useAppContainerController();

  return authenticated ? (
    <AuthenticatedAppContainer>{children}</AuthenticatedAppContainer>
  ) : (
    <GuestAppContainer>{children}</GuestAppContainer>
  );
}
