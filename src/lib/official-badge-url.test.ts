import { describe, expect, it } from "vitest";

import { officialBadgeDataUrl } from "./official-badge-url";

describe("emblema oficial como imagem", () => {
  it("desenha o emblema oficial como SVG em data URL", () => {
    const url = officialBadgeDataUrl("emblema-carapuca");
    expect(url).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(url ?? "")).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("não inventa imagem para emblema oficial desconhecido nem para URL enviada", () => {
    expect(officialBadgeDataUrl("emblema-nao-existe")).toBeUndefined();
    expect(officialBadgeDataUrl("https://cdn.example/b.png")).toBeUndefined();
  });
});
