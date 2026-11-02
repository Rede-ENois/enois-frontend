// @vitest-environment jsdom
import { type ComponentType, type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Route as BlogsRoute } from "@/routes/blogs";
import { Route as MentoriaRoute } from "@/routes/mentoria";
import { texts } from "@/texts";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  directory: vi.fn(),
  mine: vi.fn(),
  list: vi.fn(),
  profile: vi.fn(),
  slots: vi.fn(),
}));
vi.mock("@/lib/api/blogs", () => ({ blogsApi: { directory: mocks.directory, mine: mocks.mine } }));
vi.mock("@/lib/api", () => ({
  mentorsApi: { list: mocks.list, getSlots: mocks.slots },
  profileApi: { getById: mocks.profile },
  ApiError: class extends Error {},
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: { id: "me" } }) }));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/blog/blog-editor-dialog", () => ({ BlogEditorDialog: () => null }));
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: () => null }));
vi.mock("@/components/mentoring/my-sessions-section", () => ({ MySessionsSection: () => null }));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
const ownBlog = { slug: "meu-blog", title: "Meu blog", posts: 0 };
const mentor = {
  id: "mentor-me",
  userId: "me",
  expertise: ["Java"],
  rating: 0,
  sessions: 0,
  price: "Gratuito",
  banner: null,
  nextSlot: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mocks.mine.mockResolvedValue(ownBlog);
  mocks.directory.mockImplementation(async (_limit, query) =>
    query
      ? []
      : [{ ...ownBlog, authorName: "Pessoa", authorUsername: "pessoa", description: null }],
  );
  mocks.list.mockImplementation(async (_expertise, _cursor, _limit, query) => ({
    items: query ? [] : [mentor],
    nextCursor: null,
  }));
  mocks.profile.mockResolvedValue({ id: "me", name: "Pessoa", username: "pessoa" });
  mocks.slots.mockResolvedValue({ items: [], nextCursor: null });
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
async function render(Page: ComponentType) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>,
    ),
  );
  await settle();
}
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}
async function search(label: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  expect(input).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle();
}

describe("buscas dos catálogos", () => {
  it("envia a busca dos blogs ao servidor e mantém o atalho do próprio blog", async () => {
    await render(BlogsRoute.options.component as ComponentType);
    await search(texts.blog.searchPlaceholder, "  Spring  ");
    expect(mocks.directory).toHaveBeenLastCalledWith(50, "Spring");
    expect(container.textContent).toContain(texts.blog.searchEmpty);
    expect(container.textContent).toContain(texts.blog.myBlog);
    expect(container.textContent).toContain(texts.blog.edit);
    await search(texts.blog.searchPlaceholder, "");
    expect(container.textContent).not.toContain(texts.blog.searchEmpty);
    expect(container.textContent).toContain("Pessoa");
  });
  it("busca mentores no servidor sem perder o perfil de quem pesquisa", async () => {
    await render(MentoriaRoute.options.component as ComponentType);
    expect(container.textContent).toContain(texts.mentoring.editMentor);
    await search(texts.mentoring.searchPlaceholder, "  React  ");
    expect(mocks.list).toHaveBeenLastCalledWith(undefined, null, 200, "React");
    expect(container.textContent).toContain(texts.mentoring.searchEmpty);
    expect(container.textContent).toContain(texts.mentoring.editMentor);
    expect(container.textContent).not.toContain(texts.mentoring.becomeMentor);
    await search(texts.mentoring.searchPlaceholder, " ");
    expect(container.textContent).not.toContain(texts.mentoring.searchEmpty);
    expect(container.textContent).toContain("Java");
    expect(container.textContent).toContain(texts.mentoring.editMentor);
  });
});
