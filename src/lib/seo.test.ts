import { describe, expect, it } from "vitest";

import { ogMetas } from "./seo";

/**
 * O preview de rede social de cada rota.
 *
 * <p>Sem isto, quem abre o link de uma página no WhatsApp, no X ou no Telegram vê a cópia do
 * site inteiro ("Énóis · Rede humana") em vez da página — e a página é o que a pessoa está
 * abrindo. O teste trava a regra: toda rota que declara título e descrição declara também o
 * `og:title` e o `og:description` da própria página.
 */
describe("metas de rede social", () => {
  it("o helper devolve o título e a descrição da própria página", () => {
    expect(ogMetas("Termos de Uso · Énóis", "As regras do Énóis.")).toEqual([
      { property: "og:title", content: "Termos de Uso · Énóis" },
      { property: "og:description", content: "As regras do Énóis." },
    ]);
  });

  it("as rotas com título e descrição têm o preview da própria página", async () => {
    const rotas = await Promise.all([
      import("@/routes/auth.reset").then((m) => m.Route),
      import("@/routes/blogs").then((m) => m.Route),
      import("@/routes/developers").then((m) => m.Route),
      import("@/routes/diretrizes").then((m) => m.Route),
      import("@/routes/entrar").then((m) => m.Route),
      import("@/routes/feed").then((m) => m.Route),
      import("@/routes/privacidade").then((m) => m.Route),
      import("@/routes/projetos.index").then((m) => m.Route),
      import("@/routes/responsavel").then((m) => m.Route),
      import("@/routes/sobre").then((m) => m.Route),
      import("@/routes/termos").then((m) => m.Route),
      import("@/routes/profissional_.$username").then((m) => m.Route),
    ]);

    for (const rota of rotas) {
      const head = rota.options.head as unknown as (ctx: never) => {
        meta: { title?: string; property?: string; name?: string; content?: string }[];
      };
      // O perfil corporativo usa o username no título: a cabeça da rota recebe os params.
      const metas = head({ params: { username: "fulano" } } as never).meta;
      const titulo = metas.find((meta) => meta.title !== undefined)?.title;
      const descricao = metas.find((meta) => meta.name === "description")?.content;
      const ogTitulo = metas.find((meta) => meta.property === "og:title")?.content;
      const ogDescricao = metas.find((meta) => meta.property === "og:description")?.content;

      expect(titulo, `${rota.id}: sem title`).toBeDefined();
      expect(descricao, `${rota.id}: sem description`).toBeDefined();
      expect(ogTitulo, `${rota.id}: sem og:title`).toBe(titulo);
      expect(ogDescricao, `${rota.id}: og:description ≠ description`).toBe(descricao);
    }
  }, 60_000);
});
