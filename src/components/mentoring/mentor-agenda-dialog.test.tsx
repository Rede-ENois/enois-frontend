// @vitest-environment jsdom
import { act } from "react";
import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MenteeSession } from "@/types/application/mentor/mentee-session";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MentorAgendaDialog } from "./mentor-agenda-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * A agenda é a resposta para "quem se inscreveu": nome e @ do mentorado, quando é a sessão, o
 * recado e o botão de mensagem que abre a conversa direta.
 */
const mocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  completeSession: vi.fn(),
  cancelSession: vi.fn(),
  openDirect: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  mentorsApi: {
    getSessions: mocks.getSessions,
    completeSession: mocks.completeSession,
    cancelSession: mocks.cancelSession,
  },
  messagesApi: { openDirect: mocks.openDirect },
}));
vi.mock("@/lib/api/media", () => ({ resolveCdnUrl: (url: string) => url }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

const session: MenteeSession = {
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
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  mocks.getSessions.mockReset();
  mocks.completeSession.mockReset();
  mocks.cancelSession.mockReset();
  mocks.openDirect.mockReset();
  mocks.navigate.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function openAgenda(sessions: MenteeSession[]) {
  mocks.getSessions.mockResolvedValue(sessions);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <MentorAgendaDialog mentorId="mentor_1" />
      </QueryClientProvider>,
    ),
  );
  const trigger = Array.from(container.querySelectorAll("button")).find((item) =>
    item.textContent?.includes("Agenda de mentorias"),
  );
  act(() => trigger?.click());
  // A consulta roda no provider: espera ela assentar até sair do "carregando".
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    if (!document.body.textContent?.includes("Carregando inscrições...")) break;
  }
}

const buttonByText = (text: string) =>
  Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.includes(text));

describe("MentorAgendaDialog", () => {
  it("lista quem se inscreveu com horário e recado", async () => {
    await openAgenda([session]);

    expect(document.body.textContent).toContain("Ana Silva");
    expect(document.body.textContent).toContain("@ana-silva");
    expect(document.body.textContent).toContain("Quero revisar meu portfólio");
    expect(document.body.textContent).toContain("Agendada");
    // A sessão paga mostra de quanto foi o escrow (300.000 mf = 300 faíscas).
    expect(document.body.textContent).toContain("pago com 300 faíscas");
  });

  it("conclui a sessão paga e reabre o valor para o mentor", async () => {
    mocks.completeSession.mockResolvedValue({ id: "mentor_session_1", status: "COMPLETED" });
    await openAgenda([session]);

    await act(async () => {
      buttonByText("Concluir sessão")?.click();
      await Promise.resolve();
    });

    // A ação passa pelo diálogo de confirmação do design system antes de chamar a API.
    const confirm = Array.from(document.querySelectorAll("button")).filter((item) =>
      item.textContent?.includes("Concluir sessão"),
    );
    await act(async () => {
      confirm.at(-1)?.click();
      await Promise.resolve();
    });

    expect(mocks.completeSession).toHaveBeenCalledWith("mentor_1", "mentor_session_1");
  });

  it("cancela a sessão pelo diálogo de confirmação", async () => {
    mocks.cancelSession.mockResolvedValue({ id: "mentor_session_1", status: "CANCELLED" });
    await openAgenda([session]);

    await act(async () => {
      buttonByText("Cancelar sessão")?.click();
      await Promise.resolve();
    });

    const confirm = Array.from(document.querySelectorAll("button")).filter((item) =>
      item.textContent?.includes("Cancelar sessão"),
    );
    await act(async () => {
      confirm.at(-1)?.click();
      await Promise.resolve();
    });

    expect(mocks.cancelSession).toHaveBeenCalledWith("mentor_1", "mentor_session_1");
  });

  it("abre a conversa direta com o mentorado", async () => {
    mocks.openDirect.mockResolvedValue({ id: "conv_1" });
    await openAgenda([session]);

    await act(async () => {
      buttonByText("Mensagem")?.click();
      await Promise.resolve();
    });

    expect(mocks.openDirect).toHaveBeenCalledWith("user_mentee");
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: "/mensagens",
      search: { conversation: "conv_1" },
    });
  });

  it("mostra o vazio quando ninguém se inscreveu", async () => {
    await openAgenda([]);

    expect(document.body.textContent).toContain("Ninguém se inscreveu ainda");
  });
});
