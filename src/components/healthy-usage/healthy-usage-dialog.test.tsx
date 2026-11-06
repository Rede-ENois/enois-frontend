// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { Personalization } from "@/types/application/preferences/personalization";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthyUsageDialog } from "./healthy-usage-dialog";

const mocks = vi.hoisted(() => ({
  setPersonalization: vi.fn(),
  toast: vi.fn(),
  onOpenChange: vi.fn(),
}));

const PERSONALIZATION: Personalization = {
  likedTopics: ["TECNOLOGIA"],
  blockedTopics: ["POLITICA"],
  disabledModules: ["BLOGS"],
  nightRestReminder: false,
  nightRestDismissedOn: null,
  liteMode: false,
  batataMode: false,
  whatsNewEnabled: true,
  whatsNewLastSeen: null,
};

vi.mock("@/lib/api", () => ({
  preferencesApi: { setPersonalization: mocks.setPersonalization },
}));
vi.mock("@/lib/use-personalization", () => ({
  usePersonalization: () => ({ data: PERSONALIZATION }),
}));
vi.mock("@/lib/batata-mode", () => ({ writeBatataMode: vi.fn() }));
vi.mock("@/lib/healthy-usage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/healthy-usage")>()),
  readHealthyUsage: () => ({ enabled: false, minutes: 30 }),
}));
vi.mock("@/lib/lite-mode", () => ({
  prefersReducedMotion: () => false,
  readCardTilt: () => true,
  readForceMotion: () => false,
  writeCardTilt: vi.fn(),
  writeForceMotion: vi.fn(),
  writeLiteMode: vi.fn(),
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@rede-enois/design-system/ui")>()),
  useToast: () => ({ toast: mocks.toast }),
}));
// O painel tem os próprios testes; aqui o que importa é que ele chegue dentro do "Uso saudável".
vi.mock("../notifications/notification-preferences-panel", () => ({
  NotificationPreferencesPanel: () => <p>painel de notificações</p>,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const botao = (nome: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent?.trim() === nome,
  );

let root: Root;
let host: HTMLDivElement;

function montar() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <HealthyUsageDialog open onOpenChange={mocks.onOpenChange} />
      </QueryClientProvider>,
    ),
  );
}

describe("uso saudável", () => {
  beforeEach(async () => {
    mocks.setPersonalization.mockReset();
    mocks.setPersonalization.mockResolvedValue(undefined);
    mocks.toast.mockReset();
    mocks.onOpenChange.mockReset();
    montar();
    await flush();
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("abre no bem-estar e guarda avisos e preferências na outra aba", async () => {
    expect(document.body.textContent).toContain("Uso saudável");
    expect(botao("Salvar")).toBeDefined();
    expect(document.body.textContent).not.toContain("painel de notificações");

    // O Tabs do Radix ativa a aba no mousedown (o clique sintético puro não dispara).
    await act(async () => {
      botao(texts.healthyUsage.tabs.notifications)!.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      );
    });

    expect(document.body.textContent).toContain("painel de notificações");
  });

  it("salva a personalização semeada da conta", async () => {
    await act(async () => botao("Salvar")!.click());
    await flush();

    expect(mocks.setPersonalization).toHaveBeenCalledWith({
      likedTopics: ["TECNOLOGIA"],
      blockedTopics: ["POLITICA"],
      disabledModules: ["BLOGS"],
      nightRestReminder: false,
      liteMode: false,
      batataMode: false,
      whatsNewEnabled: true,
    });
    expect(mocks.onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.toast).toHaveBeenCalledWith(texts.personalization.saved, "success");
  });

  it("um assunto marcado como preferido sai do lado que não gosto", async () => {
    // "O que quero ver" e "Assuntos que não gosto" não podem ter o mesmo assunto.
    await act(async () => botao(TOPIC_LABELS.POLITICA)!.click());
    await act(async () => botao("Salvar")!.click());
    await flush();

    const values = mocks.setPersonalization.mock.calls[0]![0];
    expect(values.likedTopics).toContain("POLITICA");
    expect(values.blockedTopics).not.toContain("POLITICA");
  });
});
