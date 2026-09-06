import type { PropsWithChildren } from "react";

import { isAuthenticated } from "@/lib/use-auth";

import { AuthenticatedAppContainer } from "./authenticated-app-container";
import { GuestAppContainer } from "./guest-app-container";

export function AppContainer({ children }: PropsWithChildren) {
  return isAuthenticated() ? (
    <AuthenticatedAppContainer>{children}</AuthenticatedAppContainer>
  ) : (
    <GuestAppContainer>{children}</GuestAppContainer>
  );
}
