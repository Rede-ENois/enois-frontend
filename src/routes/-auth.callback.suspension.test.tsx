// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  search: { status: "ok" },
  navigate: vi.fn(),
  finish: vi.fn(),
  challenge: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mocks.search,
  }),
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/lib/oauth-callback", () => ({
  finishOAuthLogin: mocks.finish,
  oauthCallbackUrl: vi.fn(),
}));
vi.mock("@/lib/api/auth", () => ({ authApi: { pendingTwoFactor: mocks.challenge } }));
vi.mock("./entrar", () => ({
  TwoFactorForm: ({ onDone }: { onDone: () => void }) => (
    <button onClick={onDone}>Segundo fator solicitado</button>
  ),
}));
const { Route } = await import("./auth.callback");
const Callback = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.search = { status: "ok" };
  mocks.navigate.mockReset();
  mocks.finish.mockReset();
  mocks.challenge.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
async function render() {
  await act(async () => root.render(<Callback />));
}

describe("retorno OAuth de conta suspensa e fator pendente", () => {
  it("encaminha acesso limitado confirmado pelo servidor para a página específica", async () => {
    mocks.finish.mockResolvedValue({ accessScope: "SANCTIONS_ONLY" });
    await render();
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/conta-suspensa", replace: true });
  });
  it("obtém o desafio do cookie sem concluir login nem revelar suspensão antes do fator", async () => {
    mocks.search = { status: "two_factor_required" };
    mocks.challenge.mockResolvedValue({
      challengeId: "challenge_sintetico",
      method: "TOTP",
      expiresAt: "2026-01-01T13:00:00Z",
    });
    await render();
    expect(host.textContent).toContain("Segundo fator solicitado");
    expect(mocks.challenge).toHaveBeenCalledOnce();
    expect(mocks.finish).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain("suspensa");
  });
  it("mostra erro recuperável quando a conclusão do login falha após o segundo fator", async () => {
    mocks.search = { status: "two_factor_required" };
    mocks.challenge.mockResolvedValue({
      challengeId: "challenge_sintetico",
      method: "TOTP",
      expiresAt: "2026-01-01T13:00:00Z",
    });
    mocks.finish.mockResolvedValue(null);
    await render();
    expect(mocks.finish).not.toHaveBeenCalled();
    const completeFactor = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Segundo fator solicitado",
    );
    expect(completeFactor).toBeDefined();
    await act(async () => completeFactor?.click());
    expect(mocks.finish).toHaveBeenCalledOnce();
    expect(host.querySelector("h1")?.textContent).toBe(texts.auth.social.callbackError);
    expect(host.textContent).not.toContain("Segundo fator solicitado");
    const enter = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === texts.common.enter,
    );
    expect(enter).toBeDefined();
    expect(enter?.disabled).toBe(false);
    expect(mocks.navigate).not.toHaveBeenCalled();
    await act(async () => enter?.click());
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/entrar", search: { tab: "login" } });
  });
  it("apresenta falha explícita para desafio indisponível", async () => {
    mocks.search = { status: "two_factor_required" };
    mocks.challenge.mockRejectedValue(new Error("Desafio sintético indisponível"));
    await render();
    expect(host.textContent).toContain("Entrar");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.finish).not.toHaveBeenCalled();
  });
});
