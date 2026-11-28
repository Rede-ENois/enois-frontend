import type { PortfolioBlockView } from "@/types/application/portfolio/portfolio-block-view";
import type { PortfolioMedia } from "@/types/application/portfolio/portfolio-media";
import type { UserProject } from "@/types/application/project/user-project";
import { describe, expect, it } from "vitest";

import {
  mediaIdsOf,
  mediaKindOf,
  projectCardOf,
  toEditorBlock,
  toShowcaseBlock,
} from "./portfolio-views";

const view = (overrides: Partial<PortfolioBlockView> = {}): PortfolioBlockView => ({
  id: "block_1",
  position: 0,
  type: "TEXT",
  title: "Estudos",
  text: "Texto",
  projectId: null,
  mediaId: null,
  linkUrl: null,
  published: true,
  ...overrides,
});

const projeto: UserProject = {
  id: "proj_1",
  title: "Portaria",
  description: "Controle de acesso",
  banner: "banners/portaria.png",
  icon: null,
  stack: ["Java"],
  repoUrl: "https://github.com/ana/portaria",
  status: null,
  diary: [],
};

const media: PortfolioMedia = {
  kind: "PDF",
  fileUrl: "https://api.example.test/api/storage/uploads/media_x/file.pdf",
  imageUrl: "https://api.example.test/api/storage/paginas/batch/pagina-1.png",
};

describe("mediaKindOf", () => {
  it("reconhece imagem, vídeo e PDF", () => {
    expect(mediaKindOf("image/png")).toBe("IMAGE");
    expect(mediaKindOf("video/mp4")).toBe("VIDEO");
    expect(mediaKindOf("application/pdf")).toBe("PDF");
  });

  it("não classifica o que a vitrine não sabe mostrar", () => {
    expect(mediaKindOf("text/plain")).toBeNull();
    expect(mediaKindOf(null)).toBeNull();
  });
});

describe("mediaIdsOf", () => {
  it("lista só as mídias de peça de mídia ou PDF, uma vez cada", () => {
    expect(
      mediaIdsOf([
        view({ id: "a", type: "MEDIA", mediaId: "media_1" }),
        view({ id: "b", type: "PDF", mediaId: "media_1" }),
        view({ id: "c", type: "TEXT" }),
        view({ id: "d", type: "LINK", linkUrl: "https://exemplo.test" }),
      ]),
    ).toEqual(["media_1"]);
  });
});

describe("toShowcaseBlock", () => {
  it("resolve o card do projeto do perfil", () => {
    const block = toShowcaseBlock(
      view({ type: "PROJECT", projectId: "proj_1", title: null, text: null }),
      new Map([[projeto.id, projectCardOf(projeto)]]),
      new Map(),
    );
    expect(block.project?.title).toBe("Portaria");
    expect(block.project?.stack).toEqual(["Java"]);
  });

  it("projeto apagado mantém a peça, sem card", () => {
    const block = toShowcaseBlock(
      view({ type: "PROJECT", projectId: "sumiu" }),
      new Map(),
      new Map(),
    );
    expect(block.project).toBeNull();
    expect(block.title).toBe("Estudos");
  });

  it("mídia não resolvida fica sem URL: nada de apontar para um arquivo que não abre", () => {
    const block = toShowcaseBlock(view({ type: "PDF", mediaId: "media_x" }), new Map(), new Map());
    expect(block.mediaKind).toBeNull();
    expect(block.fileUrl).toBeNull();
    expect(block.imageUrl).toBeNull();
  });

  it("mídia resolvida traz o arquivo e a página do PDF", () => {
    const block = toShowcaseBlock(
      view({ type: "PDF", mediaId: "media_x" }),
      new Map(),
      new Map([["media_x", media]]),
    );
    expect(block.mediaKind).toBe("PDF");
    expect(block.fileUrl).toBe(media.fileUrl);
    expect(block.imageUrl).toBe(media.imageUrl);
  });

  it("link só fica na peça de link", () => {
    expect(
      toShowcaseBlock(view({ type: "TEXT", linkUrl: "https://exemplo.test" }), new Map(), new Map())
        .linkUrl,
    ).toBeNull();
    expect(
      toShowcaseBlock(view({ type: "LINK", linkUrl: "https://exemplo.test" }), new Map(), new Map())
        .linkUrl,
    ).toBe("https://exemplo.test");
  });
});

describe("toEditorBlock", () => {
  it("peça ainda não publicada aparece como alterada", () => {
    expect(toEditorBlock(view({ published: false, title: null })).unpublished).toBe(true);
    expect(toEditorBlock(view({ published: false, title: null })).title).toBe("");
    expect(toEditorBlock(view()).unpublished).toBe(false);
  });
});
