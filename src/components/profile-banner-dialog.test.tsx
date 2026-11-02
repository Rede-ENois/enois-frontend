// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  catalog: vi.fn(),
  unequip: vi.fn(),
  update: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  lojaApi: { catalog: mocks.catalog, unequip: mocks.unequip },
  profileApi: { update: mocks.update },
}));
vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/components/post/sandboxed-html-frame", () => ({ SandboxedHtmlFrame: () => null }));
// The view is the design system's; here it only exposes what the container hands it.
vi.mock("@rede-enois/design-system/domain", () => ({
  ProfileBannerDialog: (props: {
    shopBanner: string | null;
    onUseOwnCover?: () => void;
    onSave: (html: string) => void;
  }) => (
    <div>
      <p data-testid="shop-banner">{props.shopBanner ?? ""}</p>
      {props.onUseOwnCover && <button onClick={props.onUseOwnCover}>own</button>}
      <button onClick={() => props.onSave("<p>capa</p>")}>save</button>
    </div>
  ),
}));

const { ProfileBannerDialog } = await import("./profile-banner-dialog");

describe("ProfileBannerDialog", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  const button = (text: string) =>
    [...host.querySelectorAll("button")].find((item) => item.textContent === text);
  const render = async (bannerItem: string | null, props: Record<string, () => void> = {}) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <ProfileBannerDialog
            open
            onOpenChange={props.onOpenChange ?? (() => undefined)}
            initialHtml={null}
            onPickPhoto={() => undefined}
            onSaved={props.onSaved ?? (() => undefined)}
            bannerItem={bannerItem}
          />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("names the equipped shop banner and takes it off on the way back to the own cover", async () => {
    mocks.catalog.mockResolvedValue([{ id: "banner-saci", name: "Clareira" }]);
    mocks.unequip.mockResolvedValue({ id: "banner-saci", equipped: false });
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();
    await render("banner-saci", { onOpenChange, onSaved });
    expect(host.querySelector('[data-testid="shop-banner"]')!.textContent).toBe("Clareira");

    const invalidate = vi.spyOn(client, "invalidateQueries");
    await act(async () => button("own")!.click());
    await settle();
    expect(mocks.unequip).toHaveBeenCalledWith("banner-saci");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSaved).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["loja"] });
    expect(mocks.toast).toHaveBeenCalledWith("Item guardado. Ele continua seu.", "success");
  });

  it("keeps the dialog open and says why when taking the banner off fails", async () => {
    mocks.catalog.mockResolvedValue([]);
    mocks.unequip.mockRejectedValue(new Error("offline"));
    const onOpenChange = vi.fn();
    await render("banner-saci", { onOpenChange });
    // Item not in the catalog: a readable word, never the raw id.
    expect(host.querySelector('[data-testid="shop-banner"]')!.textContent).toBe("equipado");

    await act(async () => button("own")!.click());
    await settle();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.any(String), "error");
  });

  it("offers nothing about the shop without an equipped banner, and a new cover refreshes the shop", async () => {
    mocks.update.mockResolvedValue({});
    await render(null);
    expect(mocks.catalog).not.toHaveBeenCalled();
    expect(button("own")).toBeUndefined();

    const invalidate = vi.spyOn(client, "invalidateQueries");
    await act(async () => button("save")!.click());
    await settle();
    expect(mocks.update).toHaveBeenCalledWith({ bannerHtml: "<p>capa</p>" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["loja"] });
  });
});
