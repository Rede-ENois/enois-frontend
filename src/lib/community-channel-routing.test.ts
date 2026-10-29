import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("rotas de canais da comunidade", () => {
  it("mostra o catálogo só na rota exata e entrega as rotas filhas ao Outlet", () => {
    const communitiesRoute = source("src/routes/comunidades.tsx");

    expect(communitiesRoute).toMatch(
      /matchRoute\(\{\s*to:\s*"\/comunidades",\s*fuzzy:\s*false\s*\}\)/,
    );
    expect(communitiesRoute).toMatch(/if \(!isCommunityIndex\)\s*\{\s*return <Outlet \/>;\s*\}/);
  });

  it("entrega a rota do canal ao Outlet do detalhe da comunidade", () => {
    const communityRoute = source("src/routes/comunidades.$communityId.tsx");

    expect(communityRoute).toMatch(/component:\s*CommunityRoute,/);
    expect(communityRoute).toMatch(
      /matchRoute\(\{\s*to:\s*"\/comunidades\/\$communityId",\s*fuzzy:\s*false\s*\}\)/,
    );
    expect(communityRoute).toMatch(/if \(!isCommunityDetail\)\s*\{\s*return <Outlet \/>;\s*\}/);
  });
});
