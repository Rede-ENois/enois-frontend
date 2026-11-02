// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CityStateFieldProps } from "@rede-enois/design-system/patterns";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { ProfileCityDialog } from "./profile-city-dialog";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  update: vi.fn(),
  field: null as null | CityStateFieldProps,
  privacy: null as null | { value: boolean; onChange: (value: boolean) => void },
  me: {
    id: "u1",
    username: "ada",
    city: "Belo Horizonte",
    state: "MG",
    showCity: false,
  } as Record<string, unknown>,
}));

vi.mock("@rede-enois/design-system/ui", () => {
  const passThrough = ({ children }: { children?: ReactNode }) => <>{children}</>;
  return {
    Button: ({ children, ...props }: { children?: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
    Dialog: passThrough,
    DialogContent: passThrough,
    DialogDescription: passThrough,
    DialogHeader: passThrough,
    DialogTitle: passThrough,
    useToast: () => ({ toast: mocks.toast }),
  };
});
vi.mock("@rede-enois/design-system/patterns", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  CityStateField: (props: CityStateFieldProps) => {
    mocks.field = props;
    return null;
  },
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  ProfileCityPrivacy: (props: { value: boolean; onChange: (value: boolean) => void }) => {
    mocks.privacy = props;
    return null;
  },
}));
vi.mock("@/lib/api", async () => ({
  ApiError: (await import("@/lib/api-client")).ApiError,
  profileApi: { update: mocks.update },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: mocks.me }) }));

describe("ProfileCityDialog", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const submit = () =>
    act(async () => {
      host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true }));
      // Lets the mutation settle (rejections land a few ticks later).
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.toast.mockReset();
    mocks.update.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <ProfileCityDialog open onOpenChange={() => {}} />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("starts from /me and saves city, state and the privacy choice together", async () => {
    expect(mocks.field?.value).toEqual({ city: "Belo Horizonte", state: "MG" });
    mocks.update.mockResolvedValue({});

    await act(async () => mocks.privacy!.onChange(true));
    await submit();

    expect(mocks.update).toHaveBeenCalledWith({
      city: "Belo Horizonte",
      state: "MG",
      showCity: true,
    });
    expect(mocks.toast).toHaveBeenCalledWith("Cidade atualizada.", "success");
  });

  it("checks both-or-neither before calling the API", async () => {
    await act(async () => mocks.field!.onChange({ city: "Contagem", state: "" }));
    await submit();

    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.field?.error).toBeTruthy();
  });

  it("shows the server's location code under the field and clears it on edit", async () => {
    mocks.update.mockRejectedValue(new ApiError(400, "INVALID_STATE", "Estado inválido."));

    await submit();

    expect(mocks.field?.error).toBeTruthy();
    expect(host.querySelector("[role=alert]")?.textContent).toBe("");

    await act(async () => mocks.field!.onChange({ city: "Belo Horizonte", state: "SP" }));
    expect(mocks.field?.error).toBeNull();
  });

  it("shows any other rejection above the save button", async () => {
    mocks.update.mockRejectedValue(new ApiError(500, "BOOM", "Falhou agora."));

    await submit();

    expect(mocks.field?.error).toBeNull();
    expect(host.querySelector("[role=alert]")?.textContent).toBe("Falhou agora.");
  });
});
