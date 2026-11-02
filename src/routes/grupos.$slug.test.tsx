// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { GroupComment } from "@/types/application/group/group-comment";
import type { GroupPost } from "@/types/application/group/group-post";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  comments: vi.fn(),
  removeComment: vi.fn(),
  editComment: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  groupsApi: {
    comments: mocks.comments,
    removeComment: mocks.removeComment,
    editComment: mocks.editComment,
  },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: { id: "me" } }) }));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/components/profile/profile-peek", () => ({
  ProfilePeek: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@/components/mention-textarea", () => ({ MentionTextarea: () => <textarea /> }));
vi.mock("@/components/post/report-dialog", () => ({ ReportDialog: () => null }));

const { GroupPostItem } = await import("./grupos.$slug");

const post: GroupPost = {
  id: "post-1",
  groupId: "group-1",
  topicId: "topic-1",
  authorId: "other",
  authorName: "Autora",
  authorUsername: "autora",
  authorAvatar: null,
  authorBadges: [],
  content: "Publicação",
  mediaIds: [],
  pinned: false,
  reactions: 0,
  comments: 2,
  myReaction: null,
  createdAt: "2026-10-30T12:00:00Z",
};

const comment = (id: string, authorId: string, content: string): GroupComment => ({
  id,
  postId: "post-1",
  authorId,
  authorName: authorId,
  authorUsername: authorId,
  authorAvatar: null,
  authorBadges: [],
  parentCommentId: null,
  content,
  createdAt: "2026-10-30T12:05:00Z",
});

describe("comentários de publicação em grupo", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async (canModerate: boolean) => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <ul>
            <GroupPostItem groupId="group-1" post={post} canModerate={canModerate} canPin={false} />
          </ul>
        </QueryClientProvider>,
      );
    });
    const toggle = [...host.querySelectorAll("button")].find((item) =>
      item.textContent?.includes(texts.groups.commentsTitle),
    );
    await act(async () => toggle?.click());
    await settle();
  };

  const removeButtons = () =>
    [...host.querySelectorAll<HTMLButtonElement>("li li button")].filter(
      (item) => item.textContent === texts.groups.removeAction,
    );

  const editButtons = () =>
    [...host.querySelectorAll<HTMLButtonElement>("li li button")].filter(
      (item) => item.textContent === texts.common.edit,
    );

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.comments.mockResolvedValue({
      items: [comment("c-mine", "me", "meu comentário"), comment("c-other", "other", "de outra")],
    });
    mocks.removeComment.mockResolvedValue({ id: "c-mine", status: "REMOVED" });
    mocks.editComment.mockResolvedValue(comment("c-mine", "me", "corrigido"));
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("mostra remover só no comentário do próprio usuário", async () => {
    await render(false);

    expect(removeButtons()).toHaveLength(1);
    expect(removeButtons()[0]?.closest("li")?.textContent).toContain("meu comentário");
  });

  it("mostra remover em todos os comentários para quem modera", async () => {
    await render(true);

    expect(removeButtons()).toHaveLength(2);
  });

  it("mostra editar só no próprio comentário, mesmo para quem modera", async () => {
    await render(true);

    expect(editButtons()).toHaveLength(1);
    expect(editButtons()[0]?.closest("li")?.textContent).toContain("meu comentário");
  });

  it("edita o comentário com o texto aparado e fecha o editor", async () => {
    await render(false);

    await act(async () => editButtons()[0]?.click());
    const field = host.querySelector<HTMLTextAreaElement>(
      `textarea[aria-label='${texts.groups.editCommentLabel}']`,
    );
    expect(field?.value).toBe("meu comentário");

    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
        field,
        "  corrigido  ",
      );
      field!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const save = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (item) => item.textContent === texts.common.save,
    );
    await act(async () => save?.click());
    await settle();

    expect(mocks.editComment).toHaveBeenCalledWith("group-1", "post-1", "c-mine", {
      content: "corrigido",
    });
    expect(
      host.querySelector(`textarea[aria-label='${texts.groups.editCommentLabel}']`),
    ).toBeNull();
  });

  it("salvar sem mudar o texto fecha o editor sem chamar a API", async () => {
    await render(false);

    await act(async () => editButtons()[0]?.click());
    const save = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (item) => item.textContent === texts.common.save,
    );
    await act(async () => save?.click());
    await settle();

    expect(mocks.editComment).not.toHaveBeenCalled();
    expect(
      host.querySelector(`textarea[aria-label='${texts.groups.editCommentLabel}']`),
    ).toBeNull();
  });

  it("cancela a edição sem chamar a API", async () => {
    await render(false);

    await act(async () => editButtons()[0]?.click());
    const cancel = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (item) => item.textContent === texts.common.cancel,
    );
    await act(async () => cancel?.click());

    expect(mocks.editComment).not.toHaveBeenCalled();
    expect(
      host.querySelector(`textarea[aria-label='${texts.groups.editCommentLabel}']`),
    ).toBeNull();
  });

  it("confirma e remove o comentário pelo id", async () => {
    await render(false);

    await act(async () => removeButtons()[0]?.click());
    const confirm = [...document.body.querySelectorAll("button")].find(
      (item) =>
        item.textContent === texts.groups.removeAction && item.closest("[role='dialog']") !== null,
    );
    await act(async () => confirm?.click());
    await settle();

    expect(mocks.removeComment).toHaveBeenCalledWith("group-1", "post-1", "c-mine");
  });
});
