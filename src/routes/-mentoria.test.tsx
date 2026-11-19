// @vitest-environment jsdom
import { type ComponentType, type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  getSlots: vi.fn(),
  getMySessions: vi.fn(),
  bookSession: vi.fn(),
  wallet: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  ApiError: Error,
  mentorsApi: {
    list: mocks.list,
    getSlots: mocks.getSlots,
    getMySessions: mocks.getMySessions,
    bookSession: mocks.bookSession,
  },
  profileApi: { getById: vi.fn() },
  walletApi: { wallet: mocks.wallet },
  messagesApi: { openDirect: vi.fn() },
}));
vi.mock("@/lib/api-client", () => ({ ApiError: Error, randomUUID: () => "mock-id" }));
vi.mock("@/lib/api/media", () => ({
  resolveCdnUrl: (url: string | null | undefined) => url ?? undefined,
  mediaApi: { requestUpload: vi.fn(), uploadToSignedUrl: vi.fn() },
}));
vi.mock("@/lib/current-user", () => ({
  useCurrentUser: () => ({ data: { id: "mentorado" } }),
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const { Route } = await import("./mentoria");
const Mentoria = (Route as unknown as { options: { component: ComponentType } }).options.component;

it("atualiza sessões e saldo após uma reserva paga", async () => {
  const mentor = {
    id: "mentor_1",
    userId: "mentor_user",
    expertise: [],
    rating: 5,
    sessions: 0,
    price: "Mentoria",
    banner: null,
    sparksPrice: 300_000,
    roomMode: "EPAPO_SESSION",
    nextSlot: null,
  };
  const mentors = { items: [mentor], nextCursor: null };
  const slots = {
    items: [
      {
        id: "slot_1",
        startsAt: "2027-12-01T18:00:00Z",
        endsAt: "2027-12-01T19:00:00Z",
        available: true,
      },
    ],
    nextCursor: null,
  };
  mocks.list.mockResolvedValue(mentors);
  mocks.getSlots.mockResolvedValue(slots);
  mocks.getMySessions.mockResolvedValue([]);
  mocks.bookSession.mockResolvedValue({ id: "session_1", status: "SCHEDULED" });
  mocks.wallet.mockResolvedValue({ balance: 200_000 });

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(["mentors"], mentors);
  client.setQueryData(["mentor-slots", "mentor_1"], slots);
  client.setQueryData(["profile", "by-id", "mentor_user"], { name: "Mentor" });
  client.setQueryData(["my-mentor-sessions"], []);
  client.setQueryData(["wallet"], { balance: 500_000 });

  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const button = (label: string) =>
    [...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);

  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Mentoria />
        </QueryClientProvider>,
      ),
    );

    expect(button(texts.mentoring.schedule)).toBeDefined();
    await act(async () => button(texts.mentoring.schedule)!.click());

    const slot = document.querySelector<HTMLButtonElement>('[role="dialog"] [role="radio"]');
    expect(slot).not.toBeNull();
    await act(async () => slot!.click());

    const confirm = button(texts.mentoring.confirmBooking);
    expect(confirm?.disabled).toBe(false);
    await act(async () => confirm!.click());

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const wallet = client.getQueryData<{ balance: number }>(["wallet"]);
      if (mocks.getMySessions.mock.calls.length > 0 && wallet?.balance === 200_000) break;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }

    expect(mocks.bookSession).toHaveBeenCalledWith("mentor_1", "slot_1", undefined);
    expect(document.body.textContent).toContain(texts.mentoring.bookSuccess);
    expect({
      sessionFetches: mocks.getMySessions.mock.calls.length,
      balance: client.getQueryData<{ balance: number }>(["wallet"])?.balance,
    }).toEqual({ sessionFetches: 1, balance: 200_000 });
    expect(mocks.getSlots).toHaveBeenCalledTimes(1);
    expect(mocks.list).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  }
});
