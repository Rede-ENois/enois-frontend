import type { MediaAsset } from "@/types/application/media/media-asset";
import { describe, expect, it } from "vitest";

import { firstPageUrl, pageLotOf, serveObject } from "./portfolio-pages";

const asset = (overrides: Partial<MediaAsset> = {}): MediaAsset => ({
  id: "media_1",
  fileName: "caderno.pdf",
  mimeType: "application/pdf",
  size: 1,
  purpose: null as unknown as string,
  status: "READY",
  uploadUrl: null,
  cdnUrl: "paginas/media_lote/pagina-1.png",
  createdAt: "2026-11-25T12:00:00Z",
  ...overrides,
});

describe("serveObject", () => {
  it("serve a chave do bucket no CDN do app", () => {
    expect(serveObject("uploads/media_1/file.png")).toBe(
      "https://ik.imagekit.io/socialcoisa/uploads/media_1/file.png",
    );
  });

  it("sem chave não há endereço", () => {
    expect(serveObject(null)).toBeNull();
  });
});

describe("pageLotOf", () => {
  it("reconhece o lote pelas páginas do documento", () => {
    expect(pageLotOf(asset())).toBe("media_lote");
  });

  it("só PDF tem lote de páginas", () => {
    expect(pageLotOf(asset({ mimeType: "image/png" }))).toBeNull();
    expect(pageLotOf(asset({ cdnUrl: "uploads/media_1/file.pdf" }))).toBeNull();
  });
});

describe("firstPageUrl", () => {
  it("mostra a primeira folha, não a ordem em que chegou", () => {
    expect(
      firstPageUrl({
        ownerId: "user_1",
        batch: "media_lote",
        keys: ["paginas/media_lote/pagina-10.png", "paginas/media_lote/pagina-2.png"],
      }),
    ).toBe("https://ik.imagekit.io/socialcoisa/paginas/media_lote/pagina-2.png");
  });

  it("documento sem página não tem card", () => {
    expect(firstPageUrl(undefined)).toBeNull();
    expect(firstPageUrl({ ownerId: "user_1", batch: "media_lote", keys: [] })).toBeNull();
  });
});
