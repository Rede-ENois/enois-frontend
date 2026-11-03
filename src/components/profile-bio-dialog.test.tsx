// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

const mocks = vi.hoisted(() => ({ update: vi.fn(), toast: vi.fn() }));
vi.mock("@/lib/api", () => ({ profileApi: { update: mocks.update } }));
vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/components/post/sandboxed-html-frame", () => ({ SandboxedHtmlFrame: () => null }));
// A view é do design system; aqui ela só expõe o que o container entrega.
vi.mock("@rede-enois/design-system/domain", () => ({
  ProfileBioDialog: (props: { onSave: (html: string) => void }) => (
    <button onClick={() => props.onSave("<p>bio</p>")}>save</button>
  ),
}));

const { ProfileBioDialog } = await import("./profile-bio-dialog");

describe("ProfileBioDialog", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  const save = () => [...host.querySelectorAll("button")].find((b) => b.textContent === "save")!;

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

  const render = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <ProfileBioDialog
            open
            onOpenChange={() => undefined}
            initialHtml={null}
            onSaved={() => undefined}
          />
        </QueryClientProvider>,
      ),
    );
    await settle();
  };

  it("shows the reason the API gave instead of the generic line", async () => {
    const motivo = "Bio em HTML precisa de conteudo valido.";
    mocks.update.mockRejectedValue(new ApiError(400, "INVALID_PROFILE_HTML", motivo));
    await render();

    await act(async () => save().click());
    await settle();

    expect(mocks.update).toHaveBeenCalledWith({ bioHtml: "<p>bio</p>" });
    expect(mocks.toast).toHaveBeenCalledWith(motivo, "error");
  });

  it("falls back to the generic line when the failure carries no API answer", async () => {
    mocks.update.mockRejectedValue(new Error("offline"));
    await render();

    await act(async () => save().click());
    await settle();

    expect(mocks.toast).toHaveBeenCalledWith(texts.profile.bioHtml.error, "error");
  });
});
