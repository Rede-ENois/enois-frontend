// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { NotificationPreferencesProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationPreferencesPanel } from "./notification-preferences-panel";

const mocks = vi.hoisted(() => ({
  preferences: vi.fn(),
  updatePreferences: vi.fn(),
  pushConfig: vi.fn(),
  enablePush: vi.fn(),
  isPushActive: vi.fn(),
  syncPushSubscription: vi.fn(),
  pushPermission: vi.fn<() => NotificationPermission>(() => "granted"),
  toast: vi.fn(),
  view: null as NotificationPreferencesProps | null,
}));

vi.mock("@/lib/api", () => ({
  notificationsApi: {
    preferences: mocks.preferences,
    updatePreferences: mocks.updatePreferences,
  },
}));
vi.mock("@/lib/api/push", () => ({ pushApi: { config: mocks.pushConfig } }));
vi.mock("@/lib/push", () => ({
  enablePush: mocks.enablePush,
  isPushActive: mocks.isPushActive,
  isPushSupported: () => true,
  pushPermission: mocks.pushPermission,
  pushErrorMessage: (reason: string) => `erro:${reason}`,
  syncPushSubscription: mocks.syncPushSubscription,
}));
vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: mocks.toast }) }));
// A view só desenha; guardamos as props para conferir o contrato que o contêiner cumpre.
vi.mock("@rede-enois/design-system/domain", () => ({
  NotificationPreferences: (props: NotificationPreferencesProps) => {
    mocks.view = props;
    return null;
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const view = () => mocks.view!;

const PREFS = {
  weeklyDigest: true,
  pushSocial: true,
  pushMessages: true,
  pushGroups: true,
  pushJobs: true,
  pushSystem: true,
  updatedAt: null,
};

describe("preferências de notificação: contêiner", () => {
  let root: Root;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.preferences.mockResolvedValue(PREFS);
    mocks.pushConfig.mockResolvedValue({ enabled: true, publicKey: "k" });
    mocks.isPushActive.mockResolvedValue(false);
    mocks.syncPushSubscription.mockResolvedValue(true);
    mocks.pushPermission.mockReturnValue("granted");
    root = createRoot(document.createElement("div"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <NotificationPreferencesPanel />
        </QueryClientProvider>,
      ),
    );
    await flush();
  });

  afterEach(() => act(() => root.unmount()));

  it("carrega os valores sem o updatedAt e oferece ligar o push", () => {
    expect(view().values).toEqual({
      weeklyDigest: true,
      pushSocial: true,
      pushMessages: true,
      pushGroups: true,
      pushJobs: true,
      pushSystem: true,
    });
    expect(view().pushEnabled).toBe(false);
    expect(view().onEnablePush).toBeTypeOf("function");
  });

  it("muda na hora, trava só a chave salvando e confirma", async () => {
    let resolve!: (value: typeof PREFS) => void;
    mocks.updatePreferences.mockReturnValue(new Promise((r) => (resolve = r)));
    act(() => view().onChange("weeklyDigest", false));
    await flush();

    expect(mocks.updatePreferences).toHaveBeenCalledWith({ weeklyDigest: false });
    expect(view().values?.weeklyDigest).toBe(false);
    expect(view().pending).toEqual({ weeklyDigest: true });
    expect(view().saveStatus).toBe("saving");

    resolve({ ...PREFS, weeklyDigest: false });
    await flush();
    expect(view().pending?.weeklyDigest).toBe(false);
    expect(view().saveStatus).toBe("saved");
  });

  it("falha volta a chave ao valor anterior e avisa", async () => {
    mocks.updatePreferences.mockRejectedValue(new Error("offline"));
    act(() => view().onChange("pushJobs", false));
    await flush();

    expect(view().values?.pushJobs).toBe(true);
    expect(view().saveStatus).toBe("error");
  });

  it("falha ao carregar mostra o erro com nova tentativa", async () => {
    act(() => root.unmount());
    mocks.preferences.mockRejectedValue(new Error("offline"));
    root = createRoot(document.createElement("div"));
    act(() =>
      root.render(
        <QueryClientProvider
          client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          <NotificationPreferencesPanel />
        </QueryClientProvider>,
      ),
    );
    await flush();
    expect(view().loadError).toBe(true);
    expect(view().values).toBeNull();
  });

  it("ligar o push atualiza o estado", async () => {
    mocks.enablePush.mockResolvedValueOnce({ ok: true });
    act(() => view().onEnablePush!());
    await flush();

    expect(view().pushEnabled).toBe(true);
    expect(view().pushBusy).toBe(false);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("recusa vira aviso e tira o botao que nao teria efeito", async () => {
    mocks.enablePush.mockResolvedValueOnce({ ok: false, reason: "denied" });
    act(() => view().onEnablePush!());
    await flush();

    expect(mocks.toast).toHaveBeenCalledWith("erro:denied", "error");
    expect(view().pushEnabled).toBe(false);
    expect(view().onEnablePush).toBeUndefined();
  });

  it("pedido sem resposta mantem o botao para tentar de novo", async () => {
    mocks.enablePush.mockResolvedValueOnce({ ok: false, reason: "dismissed" });
    act(() => view().onEnablePush!());
    await flush();

    expect(view().pushEnabled).toBe(false);
    expect(view().onEnablePush).toBeTypeOf("function");
  });

  it("confere a inscrição do aparelho contra a chave que o servidor anuncia", () => {
    // Sem a chave, uma inscrição presa ao par VAPID antigo contava como "ligada" e escondia o
    // botão "Ligar avisos" — nenhuma notificação chegava.
    expect(mocks.isPushActive).toHaveBeenCalledWith("k");
  });

  it("inscrição viva é reposta no servidor, sem pedir permissão", async () => {
    act(() => root.unmount());
    mocks.isPushActive.mockResolvedValue(true);
    root = createRoot(document.createElement("div"));
    act(() =>
      root.render(
        <QueryClientProvider
          client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          <NotificationPreferencesPanel />
        </QueryClientProvider>,
      ),
    );
    await flush();

    expect(mocks.syncPushSubscription).toHaveBeenCalledWith("k");
    // A reposição é silenciosa: nada de novo pedido de permissão por baixo do pano.
    expect(mocks.enablePush).not.toHaveBeenCalled();
    expect(view().pushEnabled).toBe(true);
  });

  it("permissão negada não oferece um botão que falha em silêncio", async () => {
    act(() => root.unmount());
    mocks.pushPermission.mockReturnValue("denied");
    root = createRoot(document.createElement("div"));
    act(() =>
      root.render(
        <QueryClientProvider
          client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          <NotificationPreferencesPanel />
        </QueryClientProvider>,
      ),
    );
    await flush();

    expect(view().onEnablePush).toBeUndefined();
  });
});
