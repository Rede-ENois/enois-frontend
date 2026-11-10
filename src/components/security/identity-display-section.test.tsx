// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Profile } from "@/types/application/profile/profile";
import type { IdentitySectionProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IdentitySection } from "./identity-display-section";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  view: vi.fn(),
  badgeKits: vi.fn(),
  apply: vi.fn(),
  setBadges: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  preferencesApi: {
    badgeKits: mocks.badgeKits,
    applyBadgeKit: mocks.apply,
    setBadges: mocks.setBadges,
    setIdentity: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({
  hasSessionFlag: () => true,
  legacyRefreshToken: () => null,
}));
vi.mock("@/lib/use-media-upload", () => ({ useMediaUpload: () => ({ upload: vi.fn() }) }));
vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("./badge-media-provider", () => ({
  BadgeMediaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// A view do DS vira sonda: o que se prova aqui é o contrato que o app entrega a ela —
// kits mapeados com a data curta e o clique aplicando no servidor.
vi.mock("@rede-enois/design-system/domain", () => ({
  MAX_BADGES: 5,
  isOfficialBadgeId: () => false,
  IdentitySection: function View(props: IdentitySectionProps) {
    mocks.view(props);
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            props.onApplyBadgeKit({ id: "kit-1", badges: ["kit-url"], createdAtLabel: "hoje" })
          }
        >
          aplicar kit
        </button>

        <span data-testid="kits-loading">{String(props.kitsLoading)}</span>
      </div>
    );
  },
}));

const me = {
  id: "user-1",
  username: "pessoa",
  name: "Pessoa",
  openToWork: false,
  isMentor: false,
  badges: ["https://cdn/emblema-atual.png"],
} as Profile;

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

async function montar() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <IdentitySection />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.badgeKits.mockResolvedValue([
    { id: "bkit_1", badges: ["https://cdn/antigo.png"], createdAt: "2026-11-01T12:00:00Z" },
  ]);
  mocks.apply.mockImplementation(async (kitId: string) => ({ ...me, badges: ["kit-url"] }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("Seção de identidade e histórico de kits", () => {
  it("entrega os kits do servidor à view com a data formatada", async () => {
    mocks.badgeKits.mockResolvedValue([
      { id: "bkit_1", badges: ["https://cdn/antigo.png"], createdAt: "2026-11-01T12:00:00Z" },
    ]);
    await montar();

    const kits = mocks.view.mock.calls.at(-1)?.[0].badgeKits;
    expect(kits).toHaveLength(1);
    expect(kits[0].id).toBe("bkit_1");
    expect(kits[0].badges).toEqual(["https://cdn/antigo.png"]);
    expect(kits[0].createdAtLabel).not.toBe("2026-11-01T12:00:00Z");
  });

  it("aplicar um kit grava no servidor e relê o perfil e o histórico", async () => {
    await montar();

    await act(async () => {
      [...document.querySelectorAll("button")]
        .find((b) => b.textContent === "aplicar kit")
        ?.click();
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(mocks.apply).toHaveBeenCalledWith("kit-1");
    // A troca de kit passa pelo mesmo caminho do salvar: perfil e histórico são relidos.
    expect(client.getQueryState(["me", "badge-kits"])?.status).toBe("success");
    expect(mocks.setBadges).not.toHaveBeenCalled();
  });

  it("aplicar um kit que o servidor recusa mantém o erro só como aviso, sem trocar a lista", async () => {
    mocks.apply.mockRejectedValue(new Error("não"));
    await montar();
    const emblemaAntes = mocks.view.mock.calls.at(-1)?.[0].badges;

    await act(async () => {
      [...document.querySelectorAll("button")]
        .find((b) => b.textContent === "aplicar kit")
        ?.click();
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(mocks.apply).toHaveBeenCalledOnce();
    // A lista local volta ao estado da conta: o kit não foi gravado.
    expect(mocks.view.mock.calls.at(-1)?.[0].badges).toEqual(emblemaAntes);
  });

  it("marca o histórico como carregando enquanto a resposta não chega", async () => {
    mocks.badgeKits.mockReturnValue(new Promise(() => undefined));
    await montar();

    expect(document.querySelector('[data-testid="kits-loading"]')?.textContent).toBe("true");
  });
});
