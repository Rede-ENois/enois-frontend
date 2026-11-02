import { navigateToHref } from "@/utils/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PUSH_NAVIGATE,
  PUSH_SUBSCRIPTION,
  hrefDoPush,
  subscriptionDoPush,
} from "./push-navigation";

/**
 * Clique na notificação PUSH tem que abrir a tela do app, não a API.
 *
 * O backend manda na notificação um `href` de API ("/api/feed/posts/xxx"). A rota do app está
 * na tabela do front (`src/utils/navigation.ts`), que o **service worker não conhece** — então o
 * worker devolve o href para a aba traduzir. Sem isso, o clique navegava direto para o caminho
 * de API e a pessoa caía numa página que não é o post.
 */
describe("clique na notificação push", () => {
  it("a aba recebe o href e traduz pela tabela de rotas", () => {
    const href = hrefDoPush({ type: PUSH_NAVIGATE, href: "/api/feed/posts/post_123" });
    expect(href).toBe("/api/feed/posts/post_123");

    // A traducao: o mesmo href que a notificacao mostra dentro do app vira a rota do post.
    const rotas: string[] = [];
    navigateToHref(href!, (opts) => rotas.push(opts.to));
    expect(rotas).toEqual(["/post/$postId"]);
  });

  it("ignora mensagem que nao e de navegacao", () => {
    expect(hrefDoPush({ type: "outro", href: "/api/feed/posts/post_123" })).toBeNull();
    expect(hrefDoPush({ type: PUSH_NAVIGATE })).toBeNull();
    expect(hrefDoPush(null)).toBeNull();
    expect(hrefDoPush(undefined)).toBeNull();
  });

  it("o service worker usa a mesma mensagem e nao navega direto para o caminho de API", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    // A string mora nos dois lados (o worker e JavaScript puro e nao importa o app).
    expect(sw).toContain(PUSH_NAVIGATE);
    // Quando o href e de API, o worker pergunta a aba em vez de navegar.
    expect(sw).toContain('url.startsWith("/api/")');
    expect(sw).toContain("postMessage");
  });

  it("a versao do cache do worker foi incrementada (o antigo continuaria servindo)", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    const versao = sw.match(/const VERSION = "([^"]+)"/)?.[1];
    expect(versao).toBeTruthy();
    // O comentario do arquivo exige subir a versao a cada mudanca.
    expect(versao).not.toBe("enois-v7");
    expect(versao).not.toBe("enois-v9");
  });

  it("inscrição renovada pelo worker é entregue à aba para registro", () => {
    const json = {
      endpoint: "https://push.example/device-1",
      keys: { p256dh: "p", auth: "a" },
    } as PushSubscriptionJSON;

    expect(subscriptionDoPush({ type: PUSH_SUBSCRIPTION, subscription: json })).toEqual(json);
    expect(subscriptionDoPush({ type: PUSH_NAVIGATE, href: "/api/x" })).toBeNull();
    // Sem chaves completas não dá para registrar no backend.
    expect(
      subscriptionDoPush({ type: PUSH_SUBSCRIPTION, subscription: { endpoint: "https://x" } }),
    ).toBeNull();
    expect(subscriptionDoPush(null)).toBeNull();
  });

  it("o service worker renova a inscrição e avisa a aba com a mesma mensagem", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(sw).toContain("pushsubscriptionchange");
    expect(sw).toContain(PUSH_SUBSCRIPTION);
    // O Chrome entrega a inscrição nova pronta: reaproveitar evita uma segunda assinatura.
    expect(sw).toContain("event.newSubscription");
    // A chave do servidor não é buscada daqui: em produção a API mora em outro host.
    expect(sw).not.toContain('fetch("/api/push/config"');
  });
});
