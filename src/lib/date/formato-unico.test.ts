import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A regra da casa: **data e hora do app são formatadas em um lugar só** — `src/lib/date/format.ts`,
 * com o fuso fixo no do app.
 *
 * Sem essa trava, a volta do defeito é fácil: `new Date(x).toLocaleDateString("pt-BR")` no meio de
 * um componente volta a usar o fuso do RUNTIME, e o servidor (UTC) e o navegador (fuso da pessoa)
 * passam a escrever coisas diferentes — o HTML do servidor não bate com o do cliente e o React
 * regenera a árvore inteira ("Hydration failed because the server rendered text didn't match the
 * client"), que é a página trocando de lugar na hora que abre.
 *
 * As exceções estão listadas abaixo, com o motivo de cada uma.
 */

/** Arquivos liberados: usam o fuso do DEVICE de propósito (só rodam no cliente). */
const EXECOES: Record<string, string> = {
  "src/lib/night-rest.ts":
    "a janela de descanso é do aparelho de quem está usando e só é lida depois da montagem (useEffect)",
  "src/lib/min-age.ts":
    "a idade é validada no formulário, no cliente (o servidor naorenderiza esse texto)",
};

/** Padrões que indicam formatação de data no fuso do runtime. */
const PADROES: { rotulo: string; regex: RegExp }[] = [
  { rotulo: "toLocaleDateString", regex: /\.toLocaleDateString\s*\(/ },
  { rotulo: "toLocaleTimeString", regex: /\.toLocaleTimeString\s*\(/ },
  { rotulo: "Intl.DateTimeFormat com locale", regex: /Intl\.DateTimeFormat\(\s*"/ },
  { rotulo: "toLocaleString em data", regex: /new Date\([^)]*\)\.toLocaleString\s*\(/ },
  { rotulo: "getFullYear/getMonth/getDate em data", regex: /\bdate\.get(FullYear|Month|Date)\(\)/ },
  { rotulo: "getTimezoneOffset", regex: /\.getTimezoneOffset\(\)/ },
];

function arquivosDoApp(): string[] {
  const raiz = join(process.cwd(), "src");
  const encontrados: string[] = [];
  const andar = (diretorio: string) => {
    for (const entrada of readdirSync(diretorio)) {
      const caminho = join(diretorio, entrada);
      if (statSync(caminho).isDirectory()) {
        andar(caminho);
        continue;
      }
      if (!caminho.endsWith(".ts") && !caminho.endsWith(".tsx")) continue;
      if (caminho.includes(".test.")) continue;
      // No Windows o `join` devolve `\`; a lista de exceções é escrita com `/`.
      const relativa = caminho
        .slice(process.cwd().length + 1)
        .split(sep)
        .join("/");
      if (relativa === "src/lib/date/format.ts") continue;
      encontrados.push(relativa);
    }
  };
  andar(raiz);
  return encontrados;
}

describe("formato de data único", () => {
  it("nenhum componente formata data fora do helper do app", () => {
    const achados: string[] = [];
    for (const arquivo of arquivosDoApp()) {
      if (arquivo in EXECOES) continue;
      const linhas = readFileSync(join(process.cwd(), arquivo), "utf8").split("\n");
      linhas.forEach((linha, indice) => {
        for (const padrao of PADROES) {
          if (padrao.regex.test(linha)) {
            achados.push(
              `${arquivo}:${indice + 1} (${padrao.rotulo}) -> ${linha.trim().slice(0, 90)}`,
            );
          }
        }
      });
    }
    expect(achados).toEqual([]);
  });

  it("as exceções continuam com o motivo escrito", () => {
    for (const arquivo of Object.keys(EXECOES)) {
      expect(EXECOES[arquivo]?.length ?? 0).toBeGreaterThan(20);
    }
  });
});
