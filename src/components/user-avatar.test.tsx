// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FX_FRAMES } from "@/lib/avatar-frames";

import { AvatarFrameFx } from "@/components/avatar-frames/avatar-frame-fx";

import { UserAvatar } from "./user-avatar";

describe("UserAvatar com moldura", () => {
  it("moldura simples continua no próprio Avatar, sem invólucro", () => {
    const html = renderToString(
      <UserAvatar frame="moldura-violeta" alt="Ana Lima" className="h-8 w-8" />,
    );
    expect(html).toMatch(
      /^<span[^>]*class="[^"]*h-8 w-8[^"]*"[^>]*data-avatar-frame="moldura-violeta"/,
    );
    expect(html).not.toContain("moldura-fx");
  });

  it.each(FX_FRAMES)(
    "%s: invólucro com o tamanho de quem chamou e o efeito ao lado do Avatar",
    (frame) => {
      const html = renderToString(
        <UserAvatar frame={frame} alt="Ana Lima" className="h-8 w-8 shrink-0" />,
      );
      expect(html).toMatch(
        new RegExp(`^<span class="[^"]*h-8 w-8[^"]*" data-avatar-frame="${frame}">`),
      );
      expect(html).not.toContain("h-10 w-10");
      expect(html).toContain('<span aria-hidden="true" class="moldura-fx">');
      expect(html).toContain("AL");
    },
  );

  it("corta o efeito da moldura quando o avatar está em um campo compacto", () => {
    const html = renderToString(
      <UserAvatar
        frame="moldura-buraco-negro"
        frameOverflow="hidden"
        alt="Ana Lima"
        className="h-8 w-8"
      />,
    );
    expect(html).toMatch(/class="[^"]*overflow-hidden[^"]*h-8 w-8[^"]*"/);
  });

  it.each(FX_FRAMES)("%s: dois avatares não dividem ids de filtro", (frame) => {
    const html = renderToString(
      <>
        <UserAvatar frame={frame} alt="A" />
        <UserAvatar frame={frame} alt="B" />
      </>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    if (frame !== "moldura-orbita" && frame !== "moldura-galaxia") {
      expect(ids.length).toBeGreaterThan(0);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(["moldura-desconhecida", "moldura-dragao", "moldura-prisma", "toString"])(
    "efeito desconhecido %s não quebra a tela: não desenha nada",
    (frame) => {
      expect(renderToString(<AvatarFrameFx frame={frame} />)).toBe("");
    },
  );
});
