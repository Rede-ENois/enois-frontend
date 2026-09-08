import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { useAppContainerController } from "@/utils/components/app/use-app-container-controller";

import { AuthenticatedAppContainer } from "./authenticated-app-container";
import { GuestAppContainer } from "./guest-app-container";

export function AppContainer({ children }: WithRequiredChildren) {
  const { authenticated } = useAppContainerController();

  return authenticated ? (
    <AuthenticatedAppContainer>{children}</AuthenticatedAppContainer>
  ) : (
    <GuestAppContainer>{children}</GuestAppContainer>
  );
}
