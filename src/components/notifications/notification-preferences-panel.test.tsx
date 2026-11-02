// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { NotificationPreferencesProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationPreferencesPanel } from "./notification-preferences-panel";

const mocks = vi.hoisted(() => ({
  preferences: vi.fn(),
  updatePreferences: vi.fn(),
  pushConfig: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
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
  disablePush: mocks.disablePush,
  enablePush: mocks.enablePush,
  isPushActive: mocks.isPushActive,
  isPushSupported: () => true,
  pushPermission: mocks.pushPermission,
  pushErrorMessage: (reason: string) => `erro:${reason}`,
  syncPushSubscription: mocks.syncPushSubscription,
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: mocks.toast }),
  // O interruptor do design system é um probe: o que se testa é o estado que o app entrega.
  // O mínimo do `Switch` do design system que este contêiner realmente usa.
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

const avisos = () => document.querySelector<HTMLButtonElement>("[data-checked]") ?? undefined;

const PREFS = {
  weeklyDigest: true,
  pushSocial: true,
  pushMessages: true,
  pushGroups: true,
  pushJobs: true,
  pushSystem: true,
  updatedAt: null,
};

function render() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <NotificationPreferencesPanel />
      </QueryClientProvider>,
    ),
  );
  return { root, container };
}

describe("preferências de notificação: contêiner", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.view = null;
    mocks.preferences.mockResolvedValue(PREFS);
    mocks.pushConfig.mockResolvedValue({ enabled: true, publicKey: "k" });
    mocks.isPushActive.mockResolvedValue(false);
    mocks.syncPushSubscription.mockResolvedValue(true);
    mocks.pushPermission.mockReturnValue("granted");
    ({ root, container } = render());
    await flush();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("carrega os valores sem o updatedAt e deixa os avisos no próprio interruptor", () => {
    expect(view().values).toEqual({
      weeklyDigest: true,
      pushSocial: true,
      pushMessages: true,
      pushGroups: true,
      pushJobs: true,
      pushSystem: true,
    });
    expect(view().pushEnabled).toBe(false);
    // O botão de ligar do design system saiu: o interruptor "Avisos neste aparelho" é o dono.
    expect(view().onEnablePush).toBeUndefined();
    expect(container.textContent).toContain(texts.notificationPreferences.deviceTitle);
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
    ({ root, container } = render());
    await flush();
    expect(view().loadError).toBe(true);
    expect(view().values).toBeNull();
  });

  it("sem VAPID no servidor não mostra o interruptor de avisos", async () => {
    act(() => root.unmount());
    mocks.isPushActive.mockClear();
    mocks.pushConfig.mockResolvedValue({ enabled: false, publicKey: null });
    ({ root, container } = render());
    await flush();

    expect(avisos()).toBeUndefined();
    expect(mocks.isPushActive).not.toHaveBeenCalled();
  });

  it("confere a inscrição do aparelho contra a chave que o servidor anuncia", () => {
    // Sem a chave, uma inscrição presa ao par VAPID antigo contava como "ligada" e escondia o
    // botão "Ligar avisos" — nenhuma notificação chegava.
    expect(mocks.isPushActive).toHaveBeenCalledWith("k");
  });

  it("ligar nos avisos atualiza o estado e reflete nas categorias", async () => {
    mocks.enablePush.mockResolvedValueOnce({ ok: true });
    expect(avisos()!.dataset.checked).toBe("false");

    await act(async () => avisos()!.click());
    await flush();

    expect(mocks.enablePush).toHaveBeenCalledTimes(1);
    expect(avisos()!.dataset.checked).toBe("true");
    expect(view().pushEnabled).toBe(true);
    expect(view().pushBusy).toBe(false);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("desligar os avisos no próprio aparelho tira a inscrição", async () => {
    act(() => root.unmount());
    mocks.isPushActive.mockResolvedValue(true);
    ({ root, container } = render());
    await flush();
    expect(avisos()!.dataset.checked).toBe("true");

    await act(async () => avisos()!.click());
    await flush();

    expect(mocks.disablePush).toHaveBeenCalledTimes(1);
    expect(avisos()!.dataset.checked).toBe("false");
    expect(view().pushEnabled).toBe(false);
  });

  it("recusa vira aviso e tira o interruptor que não teria efeito", async () => {
    mocks.enablePush.mockResolvedValueOnce({ ok: false, reason: "denied" });
    await act(async () => avisos()!.click());
    await flush();

    expect(mocks.toast).toHaveBeenCalledWith("erro:denied", "error");
    expect(avisos()).toBeUndefined();
    expect(container.textContent).toContain(texts.account.menu.pushDenied);
    expect(view().pushEnabled).toBe(false);
  });

  it("pedido fechado sem escolha mantém o interruptor para tentar de novo", async () => {
    mocks.enablePush.mockResolvedValueOnce({ ok: false, reason: "dismissed" });
    await act(async () => avisos()!.click());
    await flush();

    expect(mocks.toast).toHaveBeenCalledWith("erro:dismissed", "error");
    expect(avisos()!.dataset.checked).toBe("false");
  });

  it("inscrição viva é reposta no servidor, sem pedir permissão", async () => {
    act(() => root.unmount());
    mocks.isPushActive.mockResolvedValue(true);
    ({ root, container } = render());
    await flush();

    expect(mocks.syncPushSubscription).toHaveBeenCalledWith("k");
    // A reposição é silenciosa: nada de novo pedido de permissão por baixo do pano.
    expect(mocks.enablePush).not.toHaveBeenCalled();
    expect(view().pushEnabled).toBe(true);
  });

  it("permissão já negada não oferece um interruptor que falha em silêncio", async () => {
    act(() => root.unmount());
    mocks.pushPermission.mockReturnValue("denied");
    ({ root, container } = render());
    await flush();

    expect(avisos()).toBeUndefined();
    expect(container.textContent).toContain(texts.account.menu.pushDenied);
  });
});
