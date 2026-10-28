/**
 * Quantas mini-janelas de conversa cabem na tela, ao lado do painel do dock.
 *
 * O dock fica ancorado à direita (`right-4`) e cresce para a ESQUERDA: cada mini-janela tem
 * 22rem (352px), o painel tem 20rem (320px) e o espaço entre eles é 8px. Com 4 janelas abertas
 * numa tela de 1024px (o menor desktop, onde o dock aparece), o conjunto tinha 1760px — 736px
 * para fora da tela pela esquerda, com o botão de fechar da janela mais à esquerda inalcançável.
 *
 * Medido em 2026-10-28 (Chrome headless, DOM real e CSS compilado da QA):
 * - 1024px com 2 janelas: a janela da esquerda começa em **-32px** (fora da tela)
 * - 1024px com 3 janelas: a primeira começa em **-392px** (fora da tela)
 * - 1280px com 4 janelas: a primeira começa em **-496px** (fora da tela)
 *
 * A conta aqui é a mesma do CSS: o que decide é quantas janelas cabem, e as que não cabem
 * simplesmente não são desenhadas (a conversa continua aberta — o `openChats` guarda todas).
 */
export const DOCK_WINDOW_WIDTH_PX = 352; // 22rem
export const DOCK_PANEL_WIDTH_PX = 320; // 20rem (w-80)
export const DOCK_GAP_PX = 8; // gap-2
export const DOCK_EDGE_PX = 16; // right-4
/**
 * Teto do store: quantas conversas podem ficar abertas ao mesmo tempo.
 *
 * Vive aqui (e não no store) para a conta do espaço e o teto serem o mesmo número — o store
 * importa daqui.
 */
export const MAX_OPEN_CHATS = 4;

/**
 * Quantas janelas cabem na largura disponível.
 *
 * @param larguraDaTela largura da janela do navegador, em pixels
 * @param jaAbertas quantas conversas estão abertas (o dock reserva a largura delas)
 */
export function janelasQueCabem(larguraDaTela: number, jaAbertas: number): number {
  const largura = Math.max(0, larguraDaTela - DOCK_EDGE_PX - DOCK_PANEL_WIDTH_PX);
  const porJanela = DOCK_WINDOW_WIDTH_PX + DOCK_GAP_PX;
  const cabem = Math.floor(largura / porJanela);
  return Math.max(0, Math.min(cabem, jaAbertas, MAX_OPEN_CHATS));
}
