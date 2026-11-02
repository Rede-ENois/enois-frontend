import { describe, expect, it, vi } from "vitest";

import { navigateToHref } from "./navigation";

function resolve(href: string) {
  const navigate = vi.fn();
  navigateToHref(href, navigate);
  return navigate;
}

describe("navigateToHref", () => {
  it("abre o painel de moderador (CTA 'Abrir painel' das notificações)", () => {
    expect(resolve("/moderador")).toHaveBeenCalledWith({ to: "/moderador" });
    expect(resolve("/moderador/")).toHaveBeenCalledWith({ to: "/moderador" });
  });

  it("resolve as demais notificações com rota própria", () => {
    expect(resolve("/suporte")).toHaveBeenCalledWith({ to: "/suporte" });
    expect(resolve("/api/diretrizes")).toHaveBeenCalledWith({ to: "/diretrizes" });
    expect(resolve("/api/carteira")).toHaveBeenCalledWith({ to: "/carteira" });
    expect(resolve("/api/penalidades")).toHaveBeenCalledWith({ to: "/penalidades" });
  });

  it("leva ao jogo específico na notificação de novo jogo", () => {
    expect(resolve("/games/kof/kawaii-survivor")).toHaveBeenCalledWith({
      to: "/games/$username/$gameSlug",
      params: { username: "kof", gameSlug: "kawaii-survivor" },
    });
  });

  it("mantém as rotas que já existiam", () => {
    expect(resolve("/feed/posts/abc")).toHaveBeenCalledWith({
      to: "/post/$postId",
      params: { postId: "abc" },
    });
    expect(resolve("/blog/kof/post-1")).toHaveBeenCalledWith({
      to: "/blog/$username/$postId",
      params: { username: "kof", postId: "post-1" },
    });
    expect(resolve("/grupos/meu-grupo")).toHaveBeenCalledWith({
      to: "/grupos/$slug",
      params: { slug: "meu-grupo" },
    });
    expect(resolve("/conversations/42")).toHaveBeenCalledWith({
      to: "/mensagens",
      search: { conversation: "42" },
    });
  });

  it("abre a vaga na mudança de status da candidatura e mantém a lista para /vagas", () => {
    expect(resolve("/vagas/job_1")).toHaveBeenCalledWith({
      to: "/vagas/$jobId",
      params: { jobId: "job_1" },
    });
    expect(resolve("/api/vagas/job_1/")).toHaveBeenCalledWith({
      to: "/vagas/$jobId",
      params: { jobId: "job_1" },
    });
    expect(resolve("/vagas")).toHaveBeenCalledWith({ to: "/vagas" });
  });

  it("leva ao marketplace no pedido de desculpa da comunidade", () => {
    expect(resolve("/marketplace")).toHaveBeenCalledWith({ to: "/marketplace" });
  });

  it("leva a seguranca quando a sessao foi mexida (novo dispositivo, 2FA redefinido)", () => {
    // O backend manda "/seguranca" e "/configuracoes/seguranca"; sem estas entradas o clique
    // na notificacao nao levava a lugar nenhum.
    expect(resolve("/seguranca")).toHaveBeenCalledWith({ to: "/seguranca" });
    expect(resolve("/configuracoes/seguranca")).toHaveBeenCalledWith({ to: "/seguranca" });
  });

  it("opens the study pairs page from its notifications", () => {
    expect(resolve("/par-de-estudo")).toHaveBeenCalledWith({ to: "/par-de-estudo" });
  });

  it("keeps the query string of the href (event notification highlights the event)", () => {
    expect(resolve("/eventos?evento=ev-1")).toHaveBeenCalledWith({
      to: "/eventos",
      search: { evento: "ev-1" },
    });
    expect(resolve("/api/feed/posts/abc?x=1")).toHaveBeenCalledWith({
      to: "/post/$postId",
      params: { postId: "abc" },
      search: { x: "1" },
    });
  });

  it("does not send an empty search when the href has none", () => {
    expect(resolve("/eventos")).toHaveBeenCalledWith({ to: "/eventos" });
    expect(resolve("/eventos?")).toHaveBeenCalledWith({ to: "/eventos" });
  });

  it("nao navega para href desconhecido nem incompleto", () => {
    expect(resolve("/desconhecido")).not.toHaveBeenCalled();
    expect(resolve("/games/so-username")).not.toHaveBeenCalled();
  });
});
