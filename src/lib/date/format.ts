/**
 * Data e hora do app, sempre no mesmo fuso.
 *
 * **Por que isto existe:** o servidor (o pod) roda em UTC e o navegador da pessoa roda no fuso
 * dela. `new Date(...).toLocaleDateString("pt-BR")` sem `timeZone` usa o fuso do runtime: o
 * servidor escrevia "23 de outubro" e o navegador "24 de outubro" (ou o inverso), o HTML do
 * servidor não batia com o do cliente e o React cuspia *"Hydration failed because the server
 * rendered text didn't match the client"* — que faz o React **regenerar a árvore inteira** no
 * cliente. Isso não é um detalhe de tela: é a página inteira trocando de lugar na hora que
 * abre (a mesma família do "cabeçalho pisca").
 *
 * **A regra da casa:** nenhuma data é formatada direto no componente. Toda data passa por aqui,
 * e aqui o fuso é fixo — o do app (`America/Sao_Paulo`) — então servidor e navegador dizem
 * exatamente a mesma coisa, qualquer que seja o fuso de quem está olhando.
 *
 * O `formato-unico.test.ts` (na mesma pasta) trava a regra: se alguém formatar uma data direto
 * num componente, o teste falha.
 */

/** Fuso do app. O Brasil não usa horário de verão desde 2019: -03:00 vale o ano inteiro. */
export const FUSO_DO_APP = "America/Sao_Paulo";

/** Deslocamento do fuso do app, usado para ler data sem fuso como hora de calendário. */
const DESLOCAMENTO_DO_APP = "-03:00";

/**
 * Montar um `Intl.DateTimeFormat` custa caro (carrega os dados do locale e do fuso), e o feed
 * formata datas em todo cartão que entra na tela. Cada combinação de locale e opções é montada
 * uma vez só. ponytail: sem limite, mas as combinações são as poucas fixas deste arquivo.
 */
const formatadores = new Map<string, Intl.DateTimeFormat>();

function formatador(locale: string, opcoes: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const chave = `${locale}|${JSON.stringify(opcoes)}`;
  let pronto = formatadores.get(chave);
  if (!pronto) {
    pronto = new Intl.DateTimeFormat(locale, { ...opcoes, timeZone: FUSO_DO_APP });
    formatadores.set(chave, pronto);
  }
  return pronto;
}

const DATA_SEM_FUSO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/**
 * Converte o valor em `Date`.
 *
 * Data **sem fuso** ("2026-10-18", "2026-10-18T12:00:00") é hora de calendário do app: entra
 * como o dia que ela representa, e não como um instante. Isso importa porque `new Date("2026-10-18")`
 * é meia-noite UTC — que, lida em São Paulo, vira o dia anterior.
 */
export function paraData(valor: string | number | Date): Date | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }
  if (typeof valor === "number") {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  const texto = valor.trim();
  const semFuso = DATA_SEM_FUSO.exec(texto);
  if (semFuso) {
    const [, ano, mes, dia, hora = "12", minuto = "00", segundo = "00"] = semFuso;
    const data = new Date(
      `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}${DESLOCAMENTO_DO_APP}`,
    );
    return Number.isNaN(data.getTime()) ? null : data;
  }
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Formata no fuso do app. Devolve string vazia quando o valor não é data — quem chama decide
 * o que mostrar no lugar (o app já tem "—" e "nunca" para isso).
 */
export function formatarData(
  valor: string | number | Date | null | undefined,
  opcoes: Intl.DateTimeFormatOptions = { dateStyle: "short" },
): string {
  if (valor === null || valor === undefined || valor === "") return "";
  const data = paraData(valor);
  if (!data) return "";
  return formatador("pt-BR", opcoes).format(data);
}

/** "18/10/2026" */
export function dataCurta(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, { dateStyle: "short" });
}

/** "18/10/2026, 01:30" */
export function dataHora(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, { dateStyle: "short", timeStyle: "short" });
}

/** "01:30:00" (24 horas) */
export function hora(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** "18 de outubro de 2026" */
export function dataLonga(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, { day: "2-digit", month: "long", year: "numeric" });
}

/** "18 de out. de 2026" */
export function dataMedia(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, { day: "2-digit", month: "short", year: "numeric" });
}

/** "18 de out." (sem o ano) */
export function dataSemAno(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, { day: "numeric", month: "short" });
}

/** "18 de out., 01:30" */
export function dataEHora(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "out. de 2026" */
export function mesAno(valor: string | number | Date | null | undefined): string {
  return formatarData(valor, { month: "short", year: "numeric" });
}

/**
 * Ano, mês e dia **no fuso do app** — para contar meses, comparar dias e afins.
 *
 * `data.getMonth()` usa o fuso do runtime: o servidor (UTC) e o navegador (fuso da pessoa)
 * contariam meses diferentes na virada do mês, e o HTML do servidor não bateria com o do
 * cliente. Aqui a leitura é sempre no fuso do app.
 */
export function partesDaData(
  valor: string | number | Date | null | undefined,
): { ano: number; mes: number; dia: number } | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const data = paraData(valor);
  if (!data) return null;
  const partes = formatador("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const pega = (tipo: string) => Number(partes.find((parte) => parte.type === tipo)?.value ?? NaN);
  return { ano: pega("year"), mes: pega("month"), dia: pega("day") };
}

/** O ano corrente no fuso do app (o do servidor e o do navegador têm de concordar). */
export function anoAtual(): number {
  return partesDaData(new Date())?.ano ?? new Date().getFullYear();
}

/**
 * O valor cru de um campo `datetime-local` ("2026-10-21T01:35") no fuso do app.
 *
 * O truque antigo (`getTimezoneOffset`) convertia para a hora local do RUNTIME: o servidor
 * (UTC) escrevia um valor e o navegador outro — o HTML não batia e o Reacthydratava errado.
 */
export function valorDeDataLocal(valor: string | number | Date | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "";
  const data = paraData(valor);
  if (!data) return "";
  const partes = formatador("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(data);
  const pega = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${pega("year")}-${pega("month")}-${pega("day")}T${pega("hour")}:${pega("minute")}`;
}

/** Hoje (`AAAA-MM-DD`) no fuso do app, o mesmo em que o backend conta os dias. */
export function hojeNoApp(agora: Date = new Date()): string {
  return valorDeDataLocal(agora).slice(0, 10);
}

/**
 * Data de evento ("2026-10-23"): é dia de calendário, não instante. Sai como "23 de out" (sem o
 * ponto e sem o "de", como o resto do app escreve).
 */
export function dataDeEvento(valor: string | null | undefined): string {
  if (!valor) return "";
  const data = paraData(valor);
  if (!data) return valor;
  // O ano corrente é lido no fuso do app (e não no do runtime) para o servidor e o navegador
  // concordarem — a mesma regra do resto do arquivo.
  const anoCorrente = formatarData(new Date(), { year: "numeric" });
  const mesmoAno = formatarData(data, { year: "numeric" }) === anoCorrente;
  return formatarData(data, {
    day: "numeric",
    month: "short",
    year: mesmoAno ? undefined : "numeric",
  })
    .replace(/\./g, "")
    .replace(/ de /g, " ");
}

/** "jan. de 2023" → "jan. 2023" (how career timelines show it, without the "de"). */
export function shortMonthYear(iso: string): string {
  return mesAno(iso).replace(" de ", " ");
}

/**
 * Inclusive months between start and end (the starting month counts), read in the app time zone so
 * server and browser agree at the turn of a month. No end means "until now".
 */
export function monthsBetween(start: string, end: string | null): number {
  const from = partesDaData(start);
  const to = partesDaData(end ?? new Date());
  if (!from || !to) return 1;
  return Math.max(1, (to.ano - from.ano) * 12 + (to.mes - from.mes) + 1);
}
