// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import type { PushToggleProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PushToggle } from "./push-toggle";

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  isActive: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  permission: vi.fn(),
  sync: vi.fn(),
}));

vi.mock("@/lib/api/push", () => ({ pushApi: { config: () => mocks.config() } }));
vi.mock("@/lib/push", () => ({
  isPushSupported: () => true,
  pushPermission: () => mocks.permission(),
  isPushActive: (key?: string) => mocks.isActive(key),
  enablePush: () => mocks.enable(),
  disablePush: () => mocks.disable(),
  syncPushSubscription: (key: string) => mocks.sync(key),
  pushErrorMessage: (reason: string) => {
    if (reason === "denied") return texts.account.menu.pushDenied;
    if (reason === "dismissed") return texts.account.menu.pushDismissed;
    return texts.account.menu.pushError;
  },
}));

// O componente do design system é um probe: o que se testa aqui é o estado que o app entrega.
vi.mock("@rede-enois/design-system/domain", () => ({
  PushToggle: ({ active, busy, error, onToggle }: PushToggleProps) => (
    <div>
      <button type="button" disabled={busy} onClick={onToggle} data-active={String(active)}>
        {active ? "ligado" : "desligado"}
      </button>
      {error && <p>{error}</p>}
    </div>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function render(onClose = vi.fn()) {
  await act(async () => {
    root.render(<PushToggle onClose={onClose} />);
  });
}

function button(): HTMLButtonElement | null {
  return container.querySelector("button");
}

describe("item de avisos no celular", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.permission.mockReturnValue("default");
    mocks.isActive.mockResolvedValue(false);
    mocks.sync.mockResolvedValue(true);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("nao aparece quando o servidor esta sem VAPID", async () => {
    mocks.config.mockResolvedValue({ enabled: false, publicKey: null });
    await render();
    expect(button()).toBeNull();
    expect(mocks.isActive).not.toHaveBeenCalled();
  });

  it("aparece quando o servidor anuncia a chave e pergunta se a inscricao vale para ela", async () => {
    mocks.config.mockResolvedValue({ enabled: true, publicKey: "chave-publica" });
    await render();
    expect(button()).not.toBeNull();
    expect(button()!.dataset.active).toBe("false");
    // A checagem recebe a chave anunciada: inscricao presa a chave antiga conta como desligada.
    expect(mocks.isActive).toHaveBeenCalledWith("chave-publica");
  });

  it("liga so no clique e fecha o menu quando da certo", async () => {
    mocks.config.mockResolvedValue({ enabled: true, publicKey: "chave-publica" });
    mocks.enable.mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    await render(onClose);

    expect(mocks.enable).not.toHaveBeenCalled();
    await act(async () => button()!.click());

    expect(mocks.enable).toHaveBeenCalledTimes(1);
    expect(button()!.dataset.active).toBe("true");
    expect(onClose).toHaveBeenCalled();
  });

  it("mostra a instrucao de liberar a permissao quando o navegador nega", async () => {
    mocks.config.mockResolvedValue({ enabled: true, publicKey: "chave-publica" });
    mocks.enable.mockResolvedValue({ ok: false, reason: "denied" });
    await render();

    await act(async () => button()!.click());

    expect(container.textContent).toContain(texts.account.menu.pushDenied);
    // Negado de vez: o item deixa de oferecer o botao que nao teria efeito.
    expect(button()).toBeNull();
  });

  it("com permissao ja negada, nem oferece o botao", async () => {
    mocks.permission.mockReturnValue("denied");
    mocks.config.mockResolvedValue({ enabled: true, publicKey: "chave-publica" });
    await render();

    expect(button()).toBeNull();
    expect(container.textContent).toContain(texts.account.menu.pushDenied);
  });

  it("liga e desliga refletindo o estado real da inscricao", async () => {
    mocks.config.mockResolvedValue({ enabled: true, publicKey: "chave-publica" });
    mocks.isActive.mockResolvedValue(true);
    await render();

    expect(button()!.dataset.active).toBe("true");
    // A inscricao viva e reposta no servidor: se a linha sumiu (limpeza da base, 410), o
    // aparelho continuava "ligado" sem receber nada.
    expect(mocks.sync).toHaveBeenCalledWith("chave-publica");
    await act(async () => button()!.click());
    expect(mocks.disable).toHaveBeenCalledTimes(1);
    expect(button()!.dataset.active).toBe("false");
  });

  it("pedido fechado sem escolha mantem o botao para tentar de novo", async () => {
    mocks.config.mockResolvedValue({ enabled: true, publicKey: "chave-publica" });
    // Fechar o dialogo deixa a permissao em "default": nao e negacao.
    mocks.enable.mockResolvedValue({ ok: false, reason: "dismissed" });
    await render();

    await act(async () => button()!.click());

    expect(container.textContent).toContain(texts.account.menu.pushDismissed);
    expect(button()).not.toBeNull();
  });
});
