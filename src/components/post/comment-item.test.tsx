// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CommentView } from "@/types/application/comment/comment-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommentItem } from "./comment-item";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CURRENT_USER = "author-1";
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  remove: vi.fn(),
  field: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  commentsApi: { update: mocks.update, remove: mocks.remove },
  profileApi: { getById: vi.fn() },
  reactionsApi: { reactToComment: vi.fn(), removeCommentReaction: vi.fn() },
}));
vi.mock("@/lib/current-user", () => ({
  useCurrentUser: () => ({ data: { id: CURRENT_USER } }),
}));
vi.mock("@/lib/use-auth", () => ({ useAuth: () => ({ requireAuth: () => true }) }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@rede-enois/design-system/ui", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
// O campo de edição é o que está sob teste: capturar as props mostra o limite que o DS recebe e
// deixa o teste digitar o texto e salvar sem depender do campo real.
vi.mock("@/components/mention-textarea", () => ({
  MentionTextarea: (props: unknown) => {
    mocks.field(props as Record<string, unknown>);
    return null;
  },
}));
vi.mock("@/components/profile/profile-peek", () => ({
  ProfilePeek: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// O diálogo de denúncia do DS se posiciona com radix, que pede um ResizeObserver no jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function comment(overrides: Partial<CommentView> = {}): CommentView {
  return {
    id: "comment-1",
    postId: "post-1",
    authorId: CURRENT_USER,
    authorName: "Pessoa",
    authorUsername: "pessoa",
    authorAvatar: null,
    content: "texto original",
    parentCommentId: null,
    status: "ACTIVE",
    createdAt: "2026-11-20T12:00:00Z",
    ...overrides,
  };
}

describe("campo de edição do comentário", () => {
  let root: Root;
  let container: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
    vi.resetAllMocks();
    mocks.update.mockResolvedValue({ content: "texto novo", editedAt: "2026-11-20T12:01:00Z" });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    client = new QueryClient();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    container.remove();
  });

  async function startEditing(item = comment()) {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <CommentItem comment={item} />
        </QueryClientProvider>,
      );
    });
    const edit = Array.from(container.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "Editar",
    );
    expect(edit, "botão Editar do próprio comentário").toBeDefined();
    await act(async () => edit!.click());
    const props = mocks.field.mock.calls.at(-1)?.[0] as Record<string, unknown> | undefined;
    expect(props, "campo de edição aberto").toBeDefined();
    return props as {
      maxLength: number;
      value: string;
      onChange: (next: string) => void;
    };
  }

  it("usa o mesmo teto do comentário novo e envia o texto inteiro", async () => {
    const props = await startEditing();
    expect(props.maxLength).toBe(800);
    expect(props.value).toBe("texto original");

    // Quem grava é o clique em Salvar (o DS usa o rascunho do próprio estado); o campo só recebe
    // o texto novo pelo onChange.
    await act(async () => props.onChange("texto novo"));
    const save = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Salvar"),
    );
    expect(save, "botão Salvar da edição").toBeDefined();
    await act(async () => save!.click());

    expect(mocks.update).toHaveBeenCalledWith("post-1", "comment-1", "texto novo");
  });
});
