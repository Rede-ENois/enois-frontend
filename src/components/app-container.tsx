import { isAuthenticated } from "@/lib/is-authenticated";
import type { WithRequiredChildren } from "@/types/components/with-required-children";

import { AuthenticatedAppContainer } from "./authenticated-app-container";
import { GuestAppContainer } from "./guest-app-container";

export function AppContainer({ children }: WithRequiredChildren) {
  return isAuthenticated() ? (
    <AuthenticatedAppContainer>{children}</AuthenticatedAppContainer>
  ) : (
    <GuestAppContainer>{children}</GuestAppContainer>
  );
}
