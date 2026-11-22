import { describe, expect, it } from "vitest";

import { isPdfMedia, isPdfUrl, pdfFileNameOf } from "./pdf-url";

describe("pdf-url", () => {
  it("reconhece URLs e mídias PDF mesmo com query string ou MIME explícito", () => {
    expect(isPdfUrl("https://cdn.example.com/apostila-algoritmos.pdf?v=2#page=3")).toBe(true);
    expect(isPdfUrl("https://cdn.example.com/foto.png")).toBe(false);
    expect(isPdfMedia({ mimeType: "application/pdf", cdnUrl: "https://x/y" })).toBe(true);
    expect(isPdfMedia({ mimeType: "image/webp", cdnUrl: "https://x/y.webp" })).toBe(false);
  });

  it("extrai nome legível do PDF e usa fallback para file.pdf genérico", () => {
    expect(pdfFileNameOf("https://cdn.example.com/docs/Estruturas%20de%20Dados.pdf")).toBe(
      "Estruturas de Dados.pdf",
    );
    expect(pdfFileNameOf("https://api.enois.ia.br/api/storage/qa/media_1/file.pdf")).toBe(
      "Documento PDF",
    );
  });
});
