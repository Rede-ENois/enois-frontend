// @vitest-environment jsdom
import type { VideoLimitResult } from "@/types/media-upload/video-limit-result";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `prepare` decide o que sobe: compressão de imagem e de vídeo. O bug que este arquivo trava é a
 * ORDEM da checagem de vídeo — quando o tamanho era checado antes da compressão, um vídeo acima do
 * teto era recusado sem passar pelo compressor, ou seja, a redução nunca rodava.
 */

const MAX = 10 * 1024 * 1024;

const mocks = vi.hoisted(() => ({
  checkVideoLimit: vi.fn(),
  compressVideo: vi.fn(),
  compressImage: vi.fn(),
}));

vi.mock("@/lib/video-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/video-limit")>();
  return { ...actual, checkVideoLimit: mocks.checkVideoLimit };
});

vi.mock("@/lib/compress-video", () => ({
  compressVideo: mocks.compressVideo,
  VideoCompressionError: class VideoCompressionError extends Error {
    constructor() {
      super("não cabe");
      this.name = "VideoCompressionError";
    }
  },
}));

vi.mock("@/lib/compress-image", () => ({ compressImage: mocks.compressImage }));

const { prepare, VideoLimitError } = await import("./use-media-upload");
const { VideoCompressionError } = await import("@/lib/compress-video");

function sizedFile(bytes: number, type = "video/mp4"): File {
  const file = new File([new Uint8Array(4)], "clipe.mp4", { type });
  Object.defineProperty(file, "size", { value: bytes });
  return file;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("prepare — vídeo acima do teto passa pela compressão antes da recusa", () => {
  it("comprime o vídeo grande em vez de recusar direto", async () => {
    const big = sizedFile(MAX * 5);
    const shrunk = sizedFile(MAX - 1);
    mocks.checkVideoLimit.mockResolvedValue({
      ok: false,
      reason: "size",
      maxBytes: MAX,
      maxSeconds: 180,
    });
    mocks.compressVideo.mockResolvedValue(shrunk);

    await expect(prepare(big)).resolves.toBe(shrunk);
    expect(mocks.compressVideo).toHaveBeenCalledWith(big);
  });

  it("recusa só quando nem a menor codificação cabe", async () => {
    const big = sizedFile(MAX * 5);
    mocks.checkVideoLimit.mockResolvedValue({
      ok: false,
      reason: "size",
      maxBytes: MAX,
      maxSeconds: 180,
    });
    mocks.compressVideo.mockRejectedValue(new VideoCompressionError());

    await expect(prepare(big)).rejects.toBeInstanceOf(VideoLimitError);
    await expect(prepare(big)).rejects.toMatchObject({ reason: "size" });
  });

  it("recusa quando o compressor devolve algo ainda acima do teto", async () => {
    const big = sizedFile(MAX * 5);
    mocks.checkVideoLimit.mockResolvedValue({
      ok: false,
      reason: "size",
      maxBytes: MAX,
      maxSeconds: 180,
    });
    mocks.compressVideo.mockResolvedValue(sizedFile(MAX + 1));

    await expect(prepare(big)).rejects.toMatchObject({ reason: "size" });
  });

  it("nem tenta comprimir um vídeo longo demais: recodificar não encurta a duração", async () => {
    const long = sizedFile(MAX * 5);
    mocks.checkVideoLimit.mockResolvedValue({
      ok: false,
      reason: "duration",
      maxBytes: MAX,
      maxSeconds: 180,
    });

    await expect(prepare(long)).rejects.toMatchObject({ reason: "duration" });
    expect(mocks.compressVideo).not.toHaveBeenCalled();
  });

  it("recusa quando o navegador não sabe recodificar e o arquivo segue acima do teto", async () => {
    const big = sizedFile(MAX * 5);
    mocks.checkVideoLimit.mockResolvedValue({
      ok: false,
      reason: "size",
      maxBytes: MAX,
      maxSeconds: 180,
    });
    mocks.compressVideo.mockResolvedValue(big);

    await expect(prepare(big)).rejects.toMatchObject({ reason: "size" });
  });
});
