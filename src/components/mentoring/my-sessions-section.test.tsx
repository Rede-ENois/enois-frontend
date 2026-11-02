// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MySession } from "@/types/application/mentor/my-session";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MySessionsSection } from "./my-sessions-section";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  getMySessions: vi.fn(),
  cancelSession: vi.fn(),
  getSessions: vi.fn(),
  openDirect: vi.fn(),
  navigate: vi.fn(),
  me: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  mentorsApi: {
    getMySessions: mocks.getMySessions,
    cancelSession: mocks.cancelSession,
    getSessions: mocks.getSessions,
  },
  messagesApi: { openDirect: mocks.openDirect },
}));
vi.mock("@/lib/api/media", () => ({ resolveCdnUrl: (url: string) => url }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: mocks.me() }) }));

const paid: MySession = {
  id: "session_paid",
  mentorId: "mentor_1",
  mentorUsername: "ana-mentora",
  mentorName: "Ana Mentora",
  mentorAvatar: null,
  startsAt: "2026-11-02T22:00:00Z",
  endsAt: "2026-11-02T23:00:00Z",
  message: null,
  status: "SCHEDULED",
  priceSparks: 300_000,
  roomUrl: "https://meet.google.com/xyz",
  roomMode: "CUSTOM",
  createdAt: "2026-10-30T12:00:00Z",
};

const free: MySession = {
  ...paid,
  id: "session_free",
  priceSparks: null,
  status: "COMPLETED",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  mocks.getMySessions.mockReset();
  mocks.cancelSession.mockReset();
  mocks.getSessions.mockReset();
  mocks.openDirect.mockReset();
  mocks.navigate.mockReset();
  mocks.me.mockReset();
  mocks.me.mockReturnValue({ id: "user_mentee" });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function render(sessions: MySession[], options: { mentorId?: string } = {}) {
  mocks.getMySessions.mockResolvedValue(sessions);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <MySessionsSection mentorId={options.mentorId} />
      </QueryClientProvider>,
    ),
  );
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    if (!container.textContent?.includes("Carregando suas sessões...")) break;
  }
}

const buttonByText = (text: string) =>
  Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes(text));

/** Aba do Tabs: "Como mentor" contém "Como mentorado" no includes, então casa pelo rótulo inteiro. */
const tabByLabel = (text: string) =>
  Array.from(container.querySelectorAll("[role='tab']")).find(
    (item) => item.textContent?.trim() === text,
  );

/** "Entrar na sala" é um link (abre em outra aba), não um botão. */
const linkByText = (text: string) =>
  Array.from(container.querySelectorAll("a")).find((item) => item.textContent?.includes(text));

/**
 * O mentorado precisa ver o que agendou, quanto pagou e conseguir cancelar antes do horário —
 * antes dessa seção, o pedido só existia na conversa de mensagens.
 */
describe("MySessionsSection", () => {
  it("mostra a sessão paga com o valor retido e a sala", async () => {
    await render([paid]);

    expect(container.textContent).toContain("Ana Mentora");
    expect(container.textContent).toContain("@ana-mentora");
    expect(container.textContent).toContain("pago com 300 faíscas");
    expect(container.textContent).toContain("https://meet.google.com/xyz");
    expect(container.textContent).toContain("Agendada");
  });

  it("mostra a sala do Jitsi da sessão com o atalho de entrar", async () => {
    const jitsi: MySession = {
      ...paid,
      id: "session_jitsi",
      roomUrl: "https://meet.jit.si/rede-mentoria-session_jitsi",
      roomMode: "JITSI_SESSION",
    };
    await render([jitsi]);

    expect(container.textContent).toContain("https://meet.jit.si/rede-mentoria-session_jitsi");
    // Sala do Jitsi tem entrada por telefone; a sala própria (Meet) não.
    expect(buttonByText("Entrar por telefone")).toBeDefined();
    expect(linkByText("Entrar na sala")?.getAttribute("href")).toBe(jitsi.roomUrl);
  });

  it("não oferece telefone para a sala própria do mentor", async () => {
    await render([paid]);

    expect(linkByText("Entrar na sala")?.getAttribute("href")).toBe(paid.roomUrl);
    expect(buttonByText("Entrar por telefone")).toBeUndefined();
  });

  it("distingue a sessão gratuita no histórico", async () => {
    await render([free]);

    expect(container.textContent).toContain("Sessão gratuita");
    expect(container.textContent).toContain("Concluída");
    // Sessão encerrada não oferece cancelamento.
    expect(buttonByText("Cancelar sessão")).toBeUndefined();
  });

  it("cancela pelo diálogo de confirmação e chama a rota do par mentor/sessão", async () => {
    mocks.cancelSession.mockResolvedValue({ id: "session_paid", status: "CANCELLED" });
    await render([paid]);

    await act(async () => {
      buttonByText("Cancelar sessão")?.click();
      await Promise.resolve();
    });

    // O ConfirmDialog é renderizado em portal: o último botão com o mesmo rótulo é o de confirmar.
    const confirm = Array.from(document.querySelectorAll("button")).filter((item) =>
      item.textContent?.includes("Cancelar sessão"),
    );
    await act(async () => {
      confirm.at(-1)?.click();
      await Promise.resolve();
    });

    expect(mocks.cancelSession).toHaveBeenCalledWith("mentor_1", "session_paid");
  });

  it("mostra o vazio para quem nunca agendou", async () => {
    await render([]);

    expect(container.textContent).toContain("Você ainda não agendou nenhuma mentoria.");
  });

  it("tem a aba 'Como mentor' quando eu também sou mentor, vazia até abrir", async () => {
    mocks.getSessions.mockResolvedValue([]);
    await render([paid], { mentorId: "mentor_1" });

    expect(tabByLabel("Como mentor")).toBeDefined();
    expect(container.textContent).not.toContain("Ninguém se inscreveu ainda");
    expect(tabByLabel("Como mentor")?.getAttribute("aria-selected")).toBe("false");
  });

  it("mostra quem agendou comigo na aba 'Como mentor'", async () => {
    mocks.getSessions.mockResolvedValue([
      {
        id: "mentor_session_1",
        menteeId: "user_mentee",
        menteeUsername: "ana-silva",
        menteeName: "Ana Silva",
        menteeAvatar: null,
        slotId: "slot_1",
        startsAt: "2026-11-02T22:00:00Z",
        endsAt: "2026-11-02T23:00:00Z",
        message: "Quero revisar meu portfólio",
        status: "SCHEDULED",
        priceSparks: 300_000,
        roomUrl: "https://meet.jit.si/rede-mentoria-mentor_session_1",
        roomMode: "JITSI_SESSION",
        createdAt: "2026-10-30T12:00:00Z",
      },
    ]);
    await render([paid], { mentorId: "mentor_1" });

    // O TabsTrigger do Radix ativa em mousedown, não em click.
    await act(async () => {
      tabByLabel("Como mentor")?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      if (container.textContent?.includes("Ana Silva")) break;
    }

    expect(container.textContent).toContain("Ana Silva");
    expect(container.textContent).toContain("@ana-silva");
    expect(container.textContent).toContain("Quero revisar meu portfólio");
  });

  it("não mostra a aba de mentor para quem só é mentorado", async () => {
    await render([paid]);

    expect(tabByLabel("Como mentor")).toBeUndefined();
  });

  it("some para quem não está logado", async () => {
    mocks.me.mockReturnValue(null);
    await render([paid]);

    expect(container.textContent).toBe("");
  });
});
