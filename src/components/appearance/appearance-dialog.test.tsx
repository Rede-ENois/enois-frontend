// @vitest-environment jsdom
import { act } from "react";
import type { ReactNode } from "react";

import { usePreferencesStore } from "@/stores/preferences.store";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppearanceDialog } from "./appearance-dialog";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }),
  useQuery: () => ({ data: [] }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/theme/sync-theme-collection", () => ({ syncThemeCollection: vi.fn() }));
vi.mock("@/lib/theme/resolve-theme-collection", () => ({ resolveThemeCollection: () => null }));
vi.mock("@/lib/api", () => ({
  cosmeticsApi: { setNameStyle: vi.fn(), setContributorTagColor: vi.fn() },
  marketplaceApi: { purchases: vi.fn() },
  themesApi: { get: vi.fn() },
}));
vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@rede-enois/design-system/domain", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@rede-enois/design-system/domain")>()),
  AppearanceDialog: ({
    onOpenChange,
    onCollectionPreview,
    itemsSlot,
  }: {
    onOpenChange: (open: boolean) => void;
    onCollectionPreview: (id: string | null) => void;
    itemsSlot?: ReactNode;
  }) => (
    <div>
      <button type="button" onClick={() => onOpenChange(false)}>
        fechar
      </button>

      <button type="button" onClick={() => onCollectionPreview("tema-experimentado")}>
        experimentar
      </button>
      {itemsSlot}
    </div>
  ),
}));
vi.mock("@/components/wallet/owned-items", () => ({
  OwnedItems: ({ onGoToStore }: { onGoToStore: () => void }) => (
    <button type="button" onClick={onGoToStore}>
      ir para a loja
    </button>
  ),
}));
vi.mock("./theme-sell-dialog", () => ({ ThemeSellDialog: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const preview = () => usePreferencesStore.getState().previewThemeCollection;

const click = (host: HTMLElement, label: string) => {
  const button = [...host.querySelectorAll("button")].find((item) => item.textContent === label);
  if (!button) throw new Error(`botão não encontrado: ${label}`);
  act(() => button.click());
};

describe("prévia de tema da galeria", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => usePreferencesStore.getState().setPreviewThemeCollection("tema-anterior"));
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    document.body.innerHTML = "";
    navigate.mockReset();
  });

  const render = (onOpenChange = vi.fn()) =>
    act(() => root.render(<AppearanceDialog open onOpenChange={onOpenChange} />));

  it("fechar o diálogo encerra a prévia pendente", () => {
    const onOpenChange = vi.fn();
    render(onOpenChange);
    click(host, "experimentar");
    expect(preview()).toBe("tema-experimentado");

    click(host, "fechar");

    expect(preview()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("ir para a loja também encerra a prévia", () => {
    render();
    click(host, "experimentar");
    expect(preview()).toBe("tema-experimentado");

    click(host, "ir para a loja");

    expect(preview()).toBeNull();
    expect(navigate).toHaveBeenCalledWith({ to: "/carteira", search: { tab: "loja" } });
  });
});
