// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { PostCardProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostCard } from "./post-card";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  card: null as PostCardProps | null,
  get: vi.fn(),
  mediaItems: [] as { id: string; width?: number | null }[],
}));

vi.mock("@/lib/api", () => ({
  communitiesApi: { follow: vi.fn(), unfollow: vi.fn() },
  feedApi: { get: mocks.get },
  mediaApi: { get: vi.fn() },
  portfolioApi: { byUsername: vi.fn() },
}));
vi.mock("@/lib/api/seals", () => ({
  sealsApi: { forPost: () => Promise.resolve({ seals: [] }) },
}));
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: { id: "u1" } }),
}));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/feed/video-autoplay", () => ({ autoplayVideoRef: vi.fn() }));
vi.mock("@/lib/feed-scroll-restoration", () => ({ saveFeedScroll: vi.fn() }));
vi.mock("@/lib/feed/saved-posts", () => ({
  savedPostsQueryOptions: () => ({ queryKey: [], queryFn: vi.fn() }),
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});
// O card do DS vira sonda: o que se prova aqui é o que o contêiner entrega a ele. O resto do pacote
// fica real: o card arrasta junto stores e peças que leem outras exportações dele.
vi.mock("@rede-enois/design-system/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/domain")>();
  return {
    ...actual,
    PostCard: (props: PostCardProps) => {
      mocks.card = props;
      return (
        <div>
          {/* Called as the DS card calls it, with the ids only: `known` is what the container adds. */}
          {props.renderMediaGrid?.({ mediaIds: props.post.mediaIds })}
        </div>
      );
    },
    PostEditDialog: () => null,
    PostPage: () => null,
    PostSealPicker: () => null,
  };
});
// A grade real só repassa o que recebe; a sonda registra os itens que chegam para desenhar.
vi.mock("./post/media-grid", () => ({
  MediaGrid: ({ mediaIds, known }: { mediaIds: string[]; known?: { id: string }[] }) => {
    mocks.mediaItems = mediaIds.map((id) => known?.find((media) => media.id === id) ?? { id });
    return null;
  },
}));

const post: PostView = {
  id: "post_1",
  authorId: "u1",
  authorUsername: "ana",
  authorName: "Ana",
  authorAvatar: null,
  type: "INSIGHT",
  content: "Olha o vídeo https://www.youtube.com/watch?v=abc123",
  tags: [],
  mediaIds: [],
  createdAt: "2026-11-03T12:00:00Z",
  visibility: "PUBLIC",
  counters: { reactions: 0, comments: 0, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE",
};

describe("PostCard container", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    mocks.card = null;
    mocks.get.mockReset();
    mocks.mediaItems = [];
    host = document.createElement("div");
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
  });

  const render = async (node: React.ReactNode) => {
    await act(async () =>
      root.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>),
    );
  };

  it("hands the media that came with the post to the grid, in the post's order", async () => {
    await render(
      <PostCard
        post={{
          ...post,
          mediaIds: ["m1", "m2"],
          media: [
            {
              id: "m2",
              cdnUrl: "/uploads/m2.webp",
              mimeType: "image/webp",
              width: 800,
              height: 600,
            },
            {
              id: "m1",
              cdnUrl: "/uploads/m1.webp",
              mimeType: "image/webp",
              width: 1200,
              height: 900,
            },
          ],
        }}
      />,
    );

    expect(mocks.mediaItems.map((item) => item.id)).toEqual(["m1", "m2"]);
    expect(mocks.mediaItems[0]).toMatchObject({ width: 1200, height: 900 });
  });

  it("leaves link videos waiting for a tap, even outside lite mode", async () => {
    // O jeito da lista é não tocar sozinho: o player de terceiro montando e desmontando conforme
    // os posts passam pela tela fazia o feed piscar.
    await render(<PostCard post={post} />);

    expect(mocks.card).not.toBeNull();
    expect(mocks.card!.autoplayLinks ?? false).toBe(false);
  });

  const settle = () =>
    act(async () => {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
    });

  it.each([false, true])(
    "consulta o artigo somente ao abrir a edição, com mediaSpoiler=%s",
    async (mediaSpoiler) => {
      const article = { ...post, type: "ARTICLE" as const, mediaSpoiler };
      mocks.get.mockResolvedValue({ ...article, articleBody: "Corpo completo" });

      await render(<PostCard post={article} />);
      expect(mocks.get).not.toHaveBeenCalled();

      expect(mocks.card?.onEdit).toBeTypeOf("function");
      await act(async () => {
        mocks.card?.onEdit?.();
      });
      await settle();

      expect(mocks.get).toHaveBeenCalledExactlyOnceWith(post.id);
      expect(client.getQueryData<PostView>(["post", post.id])?.articleBody).toBe("Corpo completo");
    },
  );

  it("não consulta o artigo de outro autor com a flag de spoiler presente", async () => {
    await render(
      <PostCard post={{ ...post, authorId: "outro", type: "ARTICLE", mediaSpoiler: false }} />,
    );

    expect(mocks.card?.isOwner).toBe(false);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("continua buscando o HTML de página com o editor fechado", async () => {
    mocks.get.mockResolvedValue({ ...post, type: "PAGE", pageHtml: "Página completa" });

    await render(<PostCard post={{ ...post, type: "PAGE" }} />);
    await settle();

    expect(mocks.get).toHaveBeenCalledExactlyOnceWith(post.id);
    expect(mocks.card?.pageHtml).toBe("Página completa");
  });

  it("recupera a flag de spoiler de artigo antigo que não a trouxe", async () => {
    mocks.get.mockResolvedValue({
      ...post,
      type: "ARTICLE",
      articleBody: "Corpo completo",
      mediaSpoiler: true,
    });

    await render(<PostCard post={{ ...post, type: "ARTICLE" }} />);
    await settle();

    expect(mocks.get).toHaveBeenCalledExactlyOnceWith(post.id);
    expect(mocks.card?.mediaSpoiler).toBe(true);
  });

  it("uma publicação de vitrine aponta para a vitrine, mas o dono não vê o resumo", async () => {
    // post.authorId é u1, o mesmo de useAuth: quem publicou já vê a própria vitrine no editor.
    await render(<PostCard post={{ ...post, type: "PORTFOLIO" }} />);

    expect(mocks.card?.hrefs.portfolio).toBe("/portfolio/ana");
    expect(mocks.card?.portfolio).toBeUndefined();
  });

  it("a publicação de outro tipo não aponta para vitrine nem traz o resumo", async () => {
    await render(<PostCard post={post} />);

    expect(mocks.card?.hrefs.portfolio).toBeNull();
    expect(mocks.card?.portfolio).toBeUndefined();
  });
});
