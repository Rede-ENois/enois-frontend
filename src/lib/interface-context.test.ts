// @vitest-environment jsdom
import type { CorporateProfileView } from "@/types/application/corporate/corporate-profile-view";
import { afterEach, describe, expect, it } from "vitest";

import {
  contextOfPath,
  destinationAfterSwitch,
  effectiveIdentity,
  professionalProfileState,
  readStoredContext,
  resolveContext,
  writeStoredContext,
} from "./interface-context";

const active: CorporateProfileView = {
  exists: true,
  username: "mel.pro",
  name: "Mel Pro",
  headline: "Headline",
  bio: "",
  avatar: "",
  banner: "",
  bannerHtml: "",
  location: "",
  industry: "",
  externalLinks: "",
  status: "ACTIVE",
};

describe("contextOfPath", () => {
  it("classifica as páginas de trabalho como profissionais", () => {
    for (const path of [
      "/vagas",
      "/vagas/job_1",
      "/vagas/job_1/candidaturas",
      "/freelances",
      "/empresas",
      "/empresa/acme",
      "/mentoria",
      "/servicos",
      "/meus-servicos",
      "/profissional",
      "/profissional/mel.pro",
    ]) {
      expect(contextOfPath(path), path).toBe("PROFESSIONAL");
    }
  });

  it("classifica as páginas de convivência como sociais", () => {
    for (const path of [
      "/rede",
      "/comunidades/c1",
      "/grupos/g",
      "/salvos",
      "/blogs",
      "/eventos",
      "/games/painel",
      "/projetos",
      "/perfil/ana",
    ]) {
      expect(contextOfPath(path), path).toBe("SOCIAL");
    }
  });

  it("deixa as páginas compartilhadas sem contexto próprio", () => {
    for (const path of ["/feed", "/mensagens", "/carteira", "/seguranca", "/post/p1", "/"]) {
      expect(contextOfPath(path), path).toBeNull();
    }
  });

  it("não confunde prefixo parecido", () => {
    expect(contextOfPath("/empresas-parceiras")).toBeNull();
    expect(contextOfPath("/perfilx")).toBeNull();
  });
});

describe("resolveContext", () => {
  it("a rota manda: link direto abre na interface da página", () => {
    expect(resolveContext("/vagas/job_1", "SOCIAL")).toBe("PROFESSIONAL");
    expect(resolveContext("/comunidades", "PROFESSIONAL")).toBe("SOCIAL");
  });

  it("página compartilhada segue a última escolha", () => {
    expect(resolveContext("/mensagens", "PROFESSIONAL")).toBe("PROFESSIONAL");
    expect(resolveContext("/feed", "SOCIAL")).toBe("SOCIAL");
  });
});

describe("destinationAfterSwitch", () => {
  it("fica na página quando ela é compartilhada", () => {
    expect(destinationAfterSwitch("/mensagens", "PROFESSIONAL")).toBeNull();
    expect(destinationAfterSwitch("/carteira", "SOCIAL")).toBeNull();
  });

  it("vai para o início da outra interface quando a página é exclusiva", () => {
    expect(destinationAfterSwitch("/comunidades", "PROFESSIONAL")).toBe("/feed");
    expect(destinationAfterSwitch("/vagas", "SOCIAL")).toBe("/feed");
  });

  it("não sai do lugar quando já está na interface escolhida", () => {
    expect(destinationAfterSwitch("/vagas", "PROFESSIONAL")).toBeNull();
  });
});

describe("stored context", () => {
  afterEach(() => window.localStorage.clear());

  it("lembra a escolha e aceita o valor do seletor antigo", () => {
    expect(readStoredContext()).toBe("SOCIAL");
    writeStoredContext("PROFESSIONAL");
    expect(readStoredContext()).toBe("PROFESSIONAL");
    window.localStorage.setItem("connect-grow-active-identity", "CORPORATE");
    expect(readStoredContext()).toBe("PROFESSIONAL");
  });
});

describe("professionalProfileState", () => {
  it("não confunde falha ou carregamento com ausência de perfil", () => {
    expect(professionalProfileState({ data: undefined, isError: false })).toBe("LOADING");
    expect(professionalProfileState({ data: undefined, isError: true })).toBe("ERROR");
  });

  it("separa perfil ativo de perfil ausente ou em rascunho", () => {
    expect(professionalProfileState({ data: active, isError: false })).toBe("ACTIVE");
    expect(professionalProfileState({ data: { ...active, status: "DRAFT" }, isError: false })).toBe(
      "NOT_READY",
    );
    expect(professionalProfileState({ data: { ...active, exists: false }, isError: false })).toBe(
      "NOT_READY",
    );
    expect(professionalProfileState({ data: null, isError: false })).toBe("NOT_READY");
  });

  it("mantém a última resposta conhecida quando uma nova consulta falha", () => {
    expect(professionalProfileState({ data: active, isError: true })).toBe("ACTIVE");
  });
});

describe("effectiveIdentity", () => {
  it("assina como profissional só no contexto profissional com perfil ATIVO", () => {
    expect(effectiveIdentity("PROFESSIONAL", active)).toBe("CORPORATE");
    expect(effectiveIdentity("PROFESSIONAL", null)).toBe("SOCIAL");
    expect(effectiveIdentity("PROFESSIONAL", { ...active, status: "DRAFT" })).toBe("SOCIAL");
    expect(effectiveIdentity("PROFESSIONAL", { ...active, exists: false })).toBe("SOCIAL");
    expect(effectiveIdentity("SOCIAL", active)).toBe("SOCIAL");
  });
});
