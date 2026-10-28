import { describe, expect, it } from "vitest";

import {
  DOCK_EDGE_PX,
  DOCK_GAP_PX,
  DOCK_PANEL_WIDTH_PX,
  DOCK_WINDOW_WIDTH_PX,
  MAX_OPEN_CHATS,
  janelasQueCabem,
} from "./chat-dock-layout";

/**
 * O dock de chat é ancorado à direita e cresce para a ESQUERDA: cada mini-janela tem 22rem
 * (352px), o painel tem 20rem (320px), o espaço entre eles é 8px e a margem da direita é 16px.
 *
 * Com 4 janelas abertas numa tela de 1024px (o menor desktop, onde o dock aparece), o conjunto
 * tinha 1760px — 736px para fora da tela pela esquerda, e o botão de fechar da janela mais à
 * esquerda ficava inalcançável. Medido em 2026-10-28 no Chrome headless com o DOM real e o CSS
 * compilado da QA:
 * - 1024px com 2 janelas: a janela da esquerda começa em **-32px** (fora da tela)
 * - 1024px com 3 janelas: a primeira começa em **-392px** (fora da tela)
 * - 1280px com 4 janelas: a primeira começa em **-496px** (fora da tela)
 *
 * A conta abaixo é a mesma do CSS; o teste trava os números para que uma mudança de largura
 * (22rem → 20rem, w-80 → w-96) não quebre o cálculo em silêncio.
 */
describe("quantas mini-janelas de conversa cabem ao lado do painel", () => {
  const larguraTotal = (janelas: number) =>
    janelas * (DOCK_WINDOW_WIDTH_PX + DOCK_GAP_PX) + DOCK_PANEL_WIDTH_PX + DOCK_EDGE_PX;

  it("a 1024px (o menor desktop) cabe uma janela", () => {
    expect(janelasQueCabem(1024, 4)).toBe(1);
  });

  it("a 1280px cabem duas janelas", () => {
    expect(janelasQueCabem(1280, 4)).toBe(2);
  });

  it("a 1440px cabem três janelas", () => {
    expect(janelasQueCabem(1440, 4)).toBe(3);
  });

  it("a 1920px cabem as quatro janelas", () => {
    expect(janelasQueCabem(1920, 4)).toBe(4);
  });

  it("nunca desenha mais janelas do que cabem na tela", () => {
    for (const largura of [1024, 1280, 1366, 1440, 1600, 1920]) {
      const cabem = janelasQueCabem(largura, MAX_OPEN_CHATS);
      expect(larguraTotal(cabem)).toBeLessThanOrEqual(largura);
    }
  });

  it("nunca desenha mais janelas do que as que estão abertas", () => {
    expect(janelasQueCabem(1920, 2)).toBe(2);
    expect(janelasQueCabem(1920, 1)).toBe(1);
    expect(janelasQueCabem(1920, 0)).toBe(0);
  });

  it("nunca desenha mais que o teto do store", () => {
    expect(janelasQueCabem(4000, 10)).toBe(MAX_OPEN_CHATS);
  });

  it("no celular não cabe janela nenhuma (e o dock nem aparece: só existe a partir de lg)", () => {
    expect(janelasQueCabem(390, 4)).toBe(0);
    expect(janelasQueCabem(500, 4)).toBe(0);
  });

  it("abaixo de 1024px (onde o dock some) a conta não desenha nada que não caiba", () => {
    // o dock só é desenhado a partir de lg (1024px); a conta é uma rede de segurança para o
    // caso de o `lg:flex` mudar, não a única garantia.
    for (const largura of [390, 500, 700, 800, 900, 1023]) {
      const cabem = janelasQueCabem(largura, 4);
      expect(larguraTotal(cabem)).toBeLessThanOrEqual(largura);
    }
  });
});
