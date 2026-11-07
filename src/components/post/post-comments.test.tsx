// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import type { CommentView } from "@/types/application/comment/comment-view";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostComments } from "./post-comments";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  field: vi.fn(),
  uploadAll: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ commentsApi: mocks }));
vi.mock("@/lib/use-auth", () => ({ useAuth: () => ({ requireAuth: () => true }) }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ uploadAll: mocks.uploadAll }),
}));
vi.mock("@/lib/feed/use-accepted-answer", () => ({
  useAcceptedAnswer: (_post: string, id: string | null) => ({ acceptedId: id }),
}));
vi.mock("./gif-picker-dialog", () => ({ GifPickerDialog: () => null }));
vi.mock("./comment-item", () => ({
  CommentItem: ({ comment }: { comment: CommentView }) => (
    <div data-comment={comment.id}>{comment.content}</div>
  ),
}));
vi.mock("@/components/mention-textarea", () => ({
  MentionTextarea: (props: unknown) => {
    mocks.field(props);
    return null;
  },
}));
// jsdom has no layout: the inline reply scrolls itself into view, a no-op here.
Element.prototype.scrollIntoView = vi.fn();

function comment(id: string, second: number, parentCommentId: string | null = null): CommentView {
  return {
    id,
    postId: "post",
    authorId: "author",
    authorName: "Pessoa",
    authorUsername: "pessoa",
    authorAvatar: null,
    content: id,
    parentCommentId,
    status: "ACTIVE",
    createdAt: `2026-10-31T12:00:${String(second).padStart(2, "0")}Z`,
  };
}
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  usePostCardStore.setState({ cards: {} });
  usePostCardStore.getState().initializePostCard("post");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  client = new QueryClient();
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  usePostCardStore.setState({ cards: {} });
});
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
function order() {
  return Array.from(container.querySelectorAll("[data-comment]")).map((item) =>
    item.getAttribute("data-comment"),
  );
}

describe("botão Comentar", () => {
  it("envia anexo sem texto pelo mesmo fluxo de upload", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    mocks.uploadAll.mockResolvedValue([{ mediaId: "uploaded-image" }]);
    mocks.create.mockResolvedValue(comment("new", 1));
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    try {
      await act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            <PostComments postId="post" postAuthorId="author" />
          </QueryClientProvider>,
        ),
      );
      await settle();
      const file = new File(["image"], "image.png", { type: "image/png" });
      const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(input, "files", { configurable: true, value: [file] });
      await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
      const button = container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      expect(button.disabled).toBe(false);
      await act(async () => button.click());
      expect(mocks.uploadAll).toHaveBeenCalledWith([{ file }]);
      expect(mocks.create.mock.calls[0].slice(0, 5)).toEqual([
        "post",
        "",
        null,
        [],
        ["uploaded-image"],
      ]);
    } finally {
      createUrl.mockRestore();
      revokeUrl.mockRestore();
    }
  });

  it("habilita com texto, impede envio duplicado e usa o formulário existente", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    let finish!: (value: CommentView) => void;
    mocks.create.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <PostComments postId="post" postAuthorId="author" />
        </QueryClientProvider>,
      ),
    );
    await settle();
    const button = () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button().textContent).toBe("Comentar");
    expect(button().disabled).toBe(true);
    await act(async () => usePostCardStore.getState().setDraft("post", "   "));
    expect(button().disabled).toBe(true);
    await act(async () => usePostCardStore.getState().setDraft("post", "Comentário"));
    expect(button().disabled).toBe(false);
    await act(async () => button().click());
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0].slice(0, 3)).toEqual(["post", "Comentário", null]);
    expect(button().disabled).toBe(true);
    expect(button().textContent).toBe("Enviando...");
    await act(async () => button().click());
    expect(mocks.create).toHaveBeenCalledTimes(1);
    await act(async () => finish(comment("new", 1)));
    expect(button().textContent).toBe("Comentar");
    expect(button().disabled).toBe(true);
  });
});

describe("ordem após enviar comentários", () => {
  it.each(["root", "reply", null])(
    "insere no fim da conversa ao responder %s e mantém a ordem ao recarregar",
    async (parent) => {
      const first = comment("root", 1);
      const reply = comment("reply", 2, "root");
      const nested = comment("nested", 3, "reply");
      const pinned = { ...comment("pinned", 4), pinned: true };
      mocks.list.mockResolvedValue({ items: [pinned, nested, reply, first], nextCursor: null });
      const created = comment("new", 5, parent);
      mocks.create.mockResolvedValue(created);
      const render = async () => {
        await act(async () =>
          root.render(
            <QueryClientProvider client={client}>
              <PostComments postId="post" postAuthorId="author" />
            </QueryClientProvider>,
          ),
        );
        await settle();
      };
      await render();
      expect(order()).toEqual(["pinned", "root", "reply", "nested"]);
      await act(async () => {
        usePostCardStore.getState().setDraft("post", "Nova resposta");
        usePostCardStore.getState().setReplyToId("post", parent);
      });
      await act(async () =>
        container
          .querySelector("form")!
          .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
      );
      await settle();
      expect(mocks.create.mock.calls[0].slice(0, 3)).toEqual(["post", "Nova resposta", parent]);
      expect(order()).toEqual(["pinned", "root", "reply", "nested", "new"]);
      mocks.list.mockResolvedValue({
        items: [created, pinned, nested, reply, first],
        nextCursor: null,
      });
      await act(async () => root.unmount());
      root = createRoot(container);
      await render();
      expect(order()).toEqual(["pinned", "root", "reply", "nested", "new"]);
    },
  );
});

/**
 * A aba "Ainda não vi" some com o post assim que ele tem comentário meu, então comentar não pode
 * revalidar o feed: o contador é atualizado no cache e a lista fica como está (issue #559).
 */
describe("comentar não revalida o feed", () => {
  it("atualiza só o contador do post, sem pedir a lista de novo", async () => {
    mocks.list.mockResolvedValue({ items: [comment("root", 1)], nextCursor: null });
    mocks.create.mockResolvedValue(comment("new", 2));
    const pagina = {
      pages: [{ items: [{ id: "post", counters: { comments: 1 } }], nextCursor: null }],
      pageParams: [null],
    };
    client.setQueryData(["feed", "UNSEEN", "", ""], pagina);
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <PostComments postId="post" postAuthorId="author" />
        </QueryClientProvider>,
      ),
    );
    await settle();
    await act(async () => usePostCardStore.getState().setDraft("post", "Comentário"));
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await settle();

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
    const feed = client.getQueryData<{ pages: { items: { counters: { comments: number } }[] }[] }>([
      "feed",
      "UNSEEN",
      "",
      "",
    ]);
    expect(feed?.pages[0].items[0].counters.comments).toBe(2);
  });
});

describe("campo do comentário", () => {
  const lastField = () =>
    mocks.field.mock.calls.at(-1)![0] as {
      placeholder: string;
      showCounter: boolean;
      toolbarVisible: boolean;
      emoteInline: boolean;
    };

  it("fala com quem é respondido e só mostra o contador perto do limite", async () => {
    mocks.list.mockResolvedValue({ items: [comment("root", 1)], nextCursor: null });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <PostComments postId="post" postAuthorId="author" />
        </QueryClientProvider>,
      ),
    );
    await settle();
    expect(lastField().placeholder).toBe("Escreva um comentário");
    expect(lastField().emoteInline).toBe(true);
    expect(lastField().toolbarVisible).toBe(false);

    await act(async () => usePostCardStore.getState().setDraft("post", "a".repeat(699)));
    expect(lastField().showCounter).toBe(false);
    await act(async () => usePostCardStore.getState().setDraft("post", "a".repeat(700)));
    expect(lastField().showCounter).toBe(true);

    await act(async () => usePostCardStore.getState().setReplyToId("post", "root"));
    expect(lastField().placeholder).toBe("Responder Pessoa…");
  });
});

describe("troca de publicação com o mesmo componente", () => {
  it("mostra só os comentários da publicação nova, mesmo se a resposta da anterior chegar depois", async () => {
    let answerOld: (value: unknown) => void = () => undefined;
    mocks.list.mockImplementation((postId: string) =>
      postId === "old"
        ? new Promise((resolve) => {
            answerOld = resolve;
          })
        : Promise.resolve({ items: [comment("new-comment", 2)], nextCursor: null }),
    );
    usePostCardStore.getState().initializePostCard("old");
    usePostCardStore.getState().initializePostCard("new");
    const render = (postId: string) =>
      act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            <PostComments postId={postId} postAuthorId="author" />
          </QueryClientProvider>,
        ),
      );

    await render("old");
    await render("new");
    await settle();
    // The previous post's answer arrives late: it must not replace the new post's comments.
    await act(async () => answerOld({ items: [comment("old-comment", 1)], nextCursor: null }));
    await settle();

    expect(order()).toEqual(["new-comment"]);
  });
});

/**
 * Um comentário recusado não é a lista falhando: antes o erro do envio entrava no mesmo estado do
 * erro de carregamento e a thread inteira sumia atrás de "Não foi possível carregar os
 * comentários" — para o autor parecia que o comentário tinha se perdido (issue #461).
 */
describe("envio recusado não some com a conversa", () => {
  it("mantém os comentários na tela e mostra o aviso junto do campo", async () => {
    mocks.list.mockResolvedValue({ items: [comment("root", 1)], nextCursor: null });
    mocks.create.mockRejectedValue(new Error("duplicado"));
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <PostComments postId="post" postAuthorId="author" />
        </QueryClientProvider>,
      ),
    );
    await settle();
    await act(async () => usePostCardStore.getState().setDraft("post", "Repetido"));
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await settle();

    expect(order()).toEqual(["root"]);
    expect(container.textContent).toContain("Não foi possível enviar o comentário.");
    expect(container.textContent).not.toContain("Não foi possível carregar os comentários.");
  });

  it("some com o aviso na tentativa seguinte", async () => {
    mocks.list.mockResolvedValue({ items: [comment("root", 1)], nextCursor: null });
    mocks.create.mockRejectedValueOnce(new Error("duplicado")).mockResolvedValue(comment("new", 2));
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <PostComments postId="post" postAuthorId="author" />
        </QueryClientProvider>,
      ),
    );
    await settle();
    const send = async () => {
      await act(async () =>
        container
          .querySelector("form")!
          .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
      );
      await settle();
    };

    await act(async () => usePostCardStore.getState().setDraft("post", "Primeira"));
    await send();
    expect(container.textContent).toContain("Não foi possível enviar o comentário.");

    await act(async () => usePostCardStore.getState().setDraft("post", "Segunda"));
    await send();
    expect(container.textContent).not.toContain("Não foi possível enviar o comentário.");
    expect(order()).toEqual(["root", "new"]);
  });
});
