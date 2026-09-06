import { isAuthenticated } from "@/lib/use-auth";
import type { AppContainerProps } from "@/types/components/app/app-container-props";

import { AuthenticatedAppContainer } from "./authenticated-app-container";
import { GuestAppContainer } from "./guest-app-container";

export function AppContainer({ children }: AppContainerProps) {
  return isAuthenticated() ? (
    <AuthenticatedAppContainer>{children}</AuthenticatedAppContainer>
  ) : (
    <GuestAppContainer>{children}</GuestAppContainer>
  );
}
