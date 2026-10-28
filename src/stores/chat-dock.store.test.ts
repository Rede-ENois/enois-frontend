import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_OPEN_CHATS } from "@/lib/chat-dock/chat-dock-layout";

import { useChatDockStore } from "./chat-dock.store";

// O store pega o storage UMA vez, na importação. No Node 26 o `localStorage` global existe mas
// vale undefined sem `--localstorage-file`, e o stub do beforeEach chegava tarde demais.
vi.hoisted(() => {
  const valores = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => valores.get(key) ?? null,
    setItem: (key: string, value: string) => valores.set(key, value),
    removeItem: (key: string) => valores.delete(key),
  });
});

/**
 * Abrir uma conversa que JÁ está aberta tem de trazê-la para a frente.
 *
 * O dock desenha só as janelas que cabem na tela (ver `chat-dock-layout.ts`). Com a conversa
 * fora do desenho, clicar nela na lista tinha de trazê-la de volta — mas o `openChat` devolvia
 * o estado intacto quando o id já estava na lista, então a conversa continuava marcada como
 * aberta **sem janela e sem botão de fechar** (achado na revisão do PR #349).
 */
describe("store do dock de chat", () => {
  const restaura = () => {
    useChatDockStore.setState({ expanded: true, openChats: [] });
  };

  // O store persiste em localStorage; sem o stub, o middleware do zustand reclama no console.
  beforeEach(() => {
    const valores = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => valores.get(key) ?? null,
      setItem: (key: string, value: string) => valores.set(key, value),
      removeItem: (key: string) => valores.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("abrir uma conversa nova a põe na frente", () => {
    restaura();
    useChatDockStore.getState().openChat("a");
    useChatDockStore.getState().openChat("b");
    expect(useChatDockStore.getState().openChats).toEqual(["b", "a"]);
  });

  it("abrir uma conversa já aberta a traz para a frente (em vez de ignorá-la)", () => {
    restaura();
    useChatDockStore.getState().openChat("a");
    useChatDockStore.getState().openChat("b");
    // "a" estava no fim (fora do desenho quando só cabe uma janela): clicar nela tem de trazê-la
    useChatDockStore.getState().openChat("a");
    expect(useChatDockStore.getState().openChats).toEqual(["a", "b"]);
  });

  it("não duplica a conversa na lista", () => {
    restaura();
    useChatDockStore.getState().openChat("a");
    useChatDockStore.getState().openChat("a");
    expect(useChatDockStore.getState().openChats).toEqual(["a"]);
  });

  it("respeita o teto de conversas abertas", () => {
    restaura();
    for (const id of ["a", "b", "c", "d", "e"]) {
      useChatDockStore.getState().openChat(id);
    }
    expect(useChatDockStore.getState().openChats.length).toBe(MAX_OPEN_CHATS);
    expect(useChatDockStore.getState().openChats).toContain("e");
    expect(useChatDockStore.getState().openChats).not.toContain("a");
  });

  it("fechar tira a conversa da lista", () => {
    restaura();
    useChatDockStore.getState().openChat("a");
    useChatDockStore.getState().openChat("b");
    useChatDockStore.getState().closeChat("a");
    expect(useChatDockStore.getState().openChats).toEqual(["b"]);
  });
});
