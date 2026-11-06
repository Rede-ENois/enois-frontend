// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Personalization } from "@/types/application/preferences/personalization";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPersonalization: vi.fn(),
  setPersonalization: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    component: options.component,
  }),
}));

vi.mock("@/lib/api", () => ({
  preferencesApi: {
    getPersonalization: mocks.getPersonalization,
    setPersonalization: mocks.setPersonalization,
  },
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// O interruptor do design system é uma sonda: o que se testa é o estado que o app entrega.
vi.mock("@rede-enois/design-system/ui", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  Switch: (props: {
    checked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      data-checked={String(props.checked)}
      disabled={props.disabled}
      onClick={() => props.onCheckedChange?.(!props.checked)}
    />
  ),
}));

const { Route } = await import("./conta_.preferencias-feed");
const FeedPreferencesPage = (
  Route as unknown as { options: { component: () => React.JSX.Element } }
).options.component;

const PREFERENCES: Personalization = {
  likedTopics: [],
  blockedTopics: [],
  disabledModules: [],
  nightRestReminder: false,
  nightRestDismissedOn: null,
  liteMode: false,
  batataMode: false,
  hideReposts: false,
};

describe("preferências de feed", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));
  const interruptor = () => host.querySelector<HTMLButtonElement>("[data-checked]") ?? undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  async function render() {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <FeedPreferencesPage />
        </QueryClientProvider>,
      );
    });
    await settle();
  }

  it("carrega o estado inicial e mostra a seção Feed com o interruptor desligado", async () => {
    mocks.getPersonalization.mockResolvedValueOnce(PREFERENCES);
    await render();

    expect(mocks.getPersonalization).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain(texts.feedPreferences.title);
    expect(host.textContent).toContain(texts.feedPreferences.feedSection);
    expect(host.textContent).toContain(texts.feedPreferences.hideReposts);
    expect(host.textContent).toContain(texts.feedPreferences.hideRepostsHint);
    expect(interruptor()?.dataset.checked).toBe("false");
  });

  it("liga o interruptor e persiste hideReposts no backend", async () => {
    // A carga inicial vem com reposts visíveis; o refetch após salvar já reflete o novo valor.
    mocks.getPersonalization
      .mockResolvedValueOnce(PREFERENCES)
      .mockResolvedValue({ ...PREFERENCES, hideReposts: true });
    mocks.setPersonalization.mockResolvedValue({ ...PREFERENCES, hideReposts: true });
    await render();

    await act(async () => interruptor()!.click());
    await settle();

    expect(mocks.setPersonalization).toHaveBeenCalledWith({ hideReposts: true });
    expect(interruptor()?.dataset.checked).toBe("true");
  });

  it("falha ao carregar mostra o erro com nova tentativa", async () => {
    mocks.getPersonalization.mockRejectedValueOnce(new Error("offline"));
    await render();
    expect(host.textContent).toContain(texts.feedPreferences.loadError);

    mocks.getPersonalization.mockResolvedValueOnce(PREFERENCES);
    const retry = [...host.querySelectorAll("button")].find((btn) =>
      btn.textContent?.includes(texts.feedPreferences.retry),
    );
    await act(async () => retry!.click());
    await settle();

    expect(mocks.getPersonalization).toHaveBeenCalledTimes(2);
    expect(interruptor()?.dataset.checked).toBe("false");
  });

  it("falha ao salvar volta o interruptor ao valor anterior e avisa", async () => {
    mocks.getPersonalization.mockResolvedValue(PREFERENCES);
    mocks.setPersonalization.mockRejectedValue(new Error("offline"));
    await render();

    await act(async () => interruptor()!.click());
    await settle();

    expect(mocks.setPersonalization).toHaveBeenCalledWith({ hideReposts: true });
    expect(interruptor()?.dataset.checked).toBe("false");
    expect(host.textContent).toContain(texts.feedPreferences.saveError);
  });
});
