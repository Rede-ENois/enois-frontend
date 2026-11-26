import type { PublishedPortfolio } from "@/types/application/portfolio/published-portfolio";
import type { Profile } from "@/types/application/profile/profile";
import { describe, expect, it } from "vitest";

import { ApiError } from "../api-client";
import {
  headlineOf,
  portfolioEntryOf,
  portfolioHref,
  portfolioTeaserOf,
  showcaseTeaserOf,
  titleOf,
} from "./portfolio-teaser";

describe("showcaseTeaserOf", () => {
  it("vira o resumo do servidor no card do Explorar, com o atalho da vitrine", () => {
    expect(
      showcaseTeaserOf({
        username: "ana souza",
        name: "Ana Souza",
        avatarUrl: null,
        version: 2,
        publishedAt: "2026-11-20T12:00:00Z",
        title: "Desenho e construo interfaces",
      }),
    ).toEqual({
      username: "ana souza",
      name: "Ana Souza",
      avatarUrl: null,
      headline: "Desenho e construo interfaces",
      href: "/portfolio/ana%20souza",
    });
  });

  it("vitrine sem texto do servidor fica sem frase", () => {
    expect(
      showcaseTeaserOf({
        username: "ana",
        name: "Ana",
        avatarUrl: "https://exemplo.test/ana.png",
        version: 1,
        publishedAt: "2026-11-20T12:00:00Z",
        title: null,
      }).headline,
    ).toBeNull();
  });
});

describe("headlineOf", () => {
  it("vira o HTML em uma frase, sem tags, estilo e script", () => {
    const html =
      "<style>body{color:red}</style><script>alert(1)</script><main><h1>Ana</h1><p>Desenho e construo interfaces.</p></main>";
    expect(headlineOf(html)).toBe("Ana Desenho e construo interfaces.");
  });

  it("desfaz as entidades comuns", () => {
    expect(headlineOf("<p>P&amp;D &lt;web&gt;</p>")).toBe("P&D <web>");
    expect(headlineOf("<p>a&nbsp;b &quot;c&quot; &#39;d&#39;</p>")).toBe("a b \"c\" 'd'");
  });

  it("não desfaz a entidade duas vezes", () => {
    expect(headlineOf("<p>&amp;lt;b&amp;gt;</p>")).toBe("&lt;b&gt;");
  });

  it("corta a frase longa com reticências", () => {
    const headline = headlineOf(`<p>${"a".repeat(300)}</p>`, 20);
    expect(headline).toBe(`${"a".repeat(19)}…`);
  });

  it("página sem texto não tem frase", () => {
    expect(headlineOf("<div><br></div>")).toBeNull();
    expect(headlineOf(null)).toBeNull();
  });
});

describe("titleOf", () => {
  it("prefere o h1 e cai para o h2", () => {
    expect(titleOf("<h2>Outro</h2><h1>Ana Souza</h1>")).toBe("Ana Souza");
    expect(titleOf("<h2>Portfólio</h2>")).toBe("Portfólio");
  });

  it("sem título é null", () => {
    expect(titleOf("<p>só texto</p>")).toBeNull();
  });
});

describe("portfolioHref", () => {
  it("escapa o username no endereço", () => {
    expect(portfolioHref("ana souza")).toBe("/portfolio/ana%20souza");
  });
});

const profile = { username: "ana", name: "Ana Souza", avatar: "avatar.png" } as Profile;

const published: PublishedPortfolio = {
  username: "ana",
  version: 3,
  html: "<h1>Ana Souza</h1><p>Desenho e construo interfaces.</p>",
  publishedAt: "2026-11-20",
  blocks: [],
};

describe("portfolioTeaserOf", () => {
  it("junta o resumo da publicação com a apresentação do perfil", () => {
    expect(portfolioTeaserOf(published, profile)).toEqual({
      username: "ana",
      name: "Ana Souza",
      avatarUrl: "avatar.png",
      headline: "Ana Souza Desenho e construo interfaces.",
      href: "/portfolio/ana",
    });
  });
});

describe("portfolioEntryOf", () => {
  it("publicação no ar vira o card com o resumo lido como visita", async () => {
    await expect(portfolioEntryOf(async () => published, profile)).resolves.toEqual({
      kind: "published",
      card: portfolioTeaserOf(published, profile),
    });
  });

  it("404 é a vitrine ainda não publicada, não uma falha", async () => {
    await expect(
      portfolioEntryOf(async () => {
        throw new ApiError(404, "PORTFOLIO_NOT_FOUND", "não encontrado");
      }, profile),
    ).resolves.toEqual({ kind: "unpublished", card: null });
  });

  it("servidor instável sobe como erro em vez de virar convite", async () => {
    await expect(
      portfolioEntryOf(async () => {
        throw new ApiError(503, undefined, "indisponível");
      }, profile),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
