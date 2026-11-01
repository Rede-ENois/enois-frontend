// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import type { CommentView } from "@/types/application/comment/comment-view";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostComments } from "./post-comments";

const mocks = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/api", () => ({ commentsApi: mocks }));
vi.mock("@/lib/use-auth", () => ({ useAuth: () => ({ requireAuth: () => true }) }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/use-media-upload", () => ({ useMediaUpload: () => ({}) }));
vi.mock("@/lib/feed/use-accepted-answer", () => ({
  useAcceptedAnswer: (_post: string, id: string | null) => ({ acceptedId: id }),
}));
vi.mock("./gif-picker-dialog", () => ({ GifPickerDialog: () => null }));
vi.mock("./comment-item", () => ({
  CommentItem: ({ comment }: { comment: CommentView }) => (
    <div data-comment={comment.id}>{comment.content}</div>
  ),
}));
vi.mock("@/components/mention-textarea", () => ({ MentionTextarea: () => null }));

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
