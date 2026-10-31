// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { OnboardingRedirect } from "./onboarding-redirect";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), me: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useRouterState: ({ select }: { select: (state: unknown) => string }) =>
    select({ location: { pathname: "/feed" } }),
}));
vi.mock("@/lib/api", () => ({ authApi: { me: mocks.me } }));
vi.mock("@/lib/require-auth", () => ({ hasSession: () => true }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  sessionStorage.clear();
  mocks.navigate.mockReset();
  mocks.me.mockResolvedValue({ onboardingCompleted: false });
  host = document.createElement("div");
  root = createRoot(host);
});

afterEach(() => act(() => root.unmount()));

// A navigation that gets lost (cancelled by another one, screen never mounts) must not spend the
// once-per-session offer: only the onboarding screen marks it as shown (QA, 31/10).
it("sends the person to the onboarding without marking it as shown", async () => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <OnboardingRedirect />
      </QueryClientProvider>,
    ),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(mocks.navigate).toHaveBeenCalledWith({ to: "/boas-vindas", replace: true });
  expect(sessionStorage.getItem("onboarding-shown")).toBeNull();
});
