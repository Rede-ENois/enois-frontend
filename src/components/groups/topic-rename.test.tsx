// @vitest-environment jsdom
import { type ComponentType, type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Route } from "@/routes/grupos.$slug";
import { texts } from "@/texts";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: "OWNER",
  name: "Avisos",
  update: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  groupsApi: {
    get: async () => ({
      id: "group",
      slug: "grupo",
      name: "Grupo",
      joined: true,
      viewerRole: mocks.role,
    }),
    topics: async () => ({ items: [{ id: "topic", name: mocks.name, status: "ARCHIVED" }] }),
    posts: async () => ({ items: [] }),
    pinned: async () => null,
    requests: async () => ({ items: [] }),
    members: async () => ({ items: [] }),
    updateTopic: mocks.update,
  },
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ options, useParams: () => ({ slug: "grupo" }) }),
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ state: { status: "idle" } }),
}));
vi.mock("@rede-enois/design-system/ui", async (original) => ({
  ...(await original<typeof import("@rede-enois/design-system/ui")>()),
  useToast: () => ({ toast: mocks.toast }),
}));

let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.role = "OWNER";
  mocks.name = "Avisos";
  mocks.update.mockImplementation(async (_group, _topic, data) => {
    mocks.name = data.name;
  });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
});
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}
async function render() {
  const Page = Route.options.component as ComponentType;
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>,
    ),
  );
  await settle();
}
function button(label: string) {
  return Array.from(document.querySelectorAll("button")).find(
    (node) => node.textContent?.trim() === label,
  );
}
async function click(label: string) {
  await act(async () => button(label)!.click());
  await settle();
}
async function name(value: string) {
  const input = document.querySelector<HTMLInputElement>("#topicName")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("renomear tópico do grupo", () => {
  it("permite ao dono renomear o tópico selecionado e atualiza o rótulo", async () => {
    await render();
    expect(button(texts.groups.renameTopic)).toBeUndefined();
    await click("Avisos ·");
    await click(texts.groups.renameTopic);
    expect(document.querySelector<HTMLInputElement>("#topicName")!.value).toBe("Avisos");
    expect(button(texts.common.save)!.disabled).toBe(true);
    await name("   ");
    expect(button(texts.common.save)!.disabled).toBe(true);
    await name("  Novidades  ");
    await click(texts.common.save);
    expect(mocks.update).toHaveBeenCalledWith("group", "topic", { name: "Novidades" });
    expect(button("Novidades ·")).toBeDefined();
    expect(document.querySelector("#topicName")).toBeNull();
  });

  it.each(["ADMIN", "MODERATOR", "MEMBER"])("não oferece renomear para %s", async (role) => {
    mocks.role = role;
    await render();
    await click("Avisos ·");
    expect(button(texts.groups.renameTopic)).toBeUndefined();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("mantém o nome digitado e mostra o erro quando o servidor recusa", async () => {
    mocks.update.mockRejectedValue(new Error("Nome já utilizado"));
    await render();
    await click("Avisos ·");
    await click(texts.groups.renameTopic);
    await name("Novidades");
    await click(texts.common.save);
    expect(document.querySelector<HTMLInputElement>("#topicName")!.value).toBe("Novidades");
    expect(mocks.toast).toHaveBeenCalledWith("Nome já utilizado", "error");
  });
});
