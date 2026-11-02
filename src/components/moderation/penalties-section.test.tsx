// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import type { AdminSanctionView } from "@/types/application/moderation/admin-sanction-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PenaltyCard } from "@/components/moderation/penalties-section";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const base: AdminSanctionView = {
  id: "sanc_1",
  userId: "user_1",
  username: "ana-silva",
  name: "Ana Silva",
  reportId: null,
  type: "RESTRICTION",
  reason: "Discussao tecnica que virou ofensa.",
  status: "ACTIVE",
  createdAt: "2026-10-29T12:00:00Z",
  removedAt: null,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(sanction: Partial<AdminSanctionView>) {
  const onRevoke = vi.fn();
  const onEdit = vi.fn();
  act(() =>
    root.render(
      <PenaltyCard sanction={{ ...base, ...sanction }} onRevoke={onRevoke} onEdit={onEdit} />,
    ),
  );
  return { onRevoke, onEdit };
}

const buttonByText = (text: string) =>
  Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.includes(text));

/** O admin precisa ver de quem é a penalidade, qual é e o motivo antes de corrigir. */
describe("PenaltyCard", () => {
  it("mostra o autor, o tipo e o motivo da penalidade ativa", () => {
    render({ type: "PERMABAN" });

    expect(container.textContent).toContain("@ana-silva");
    expect(container.textContent).toContain("Ana Silva");
    expect(container.textContent).toContain(texts.moderator.penalties.typePermaban);
    expect(container.textContent).toContain(base.reason!);
  });

  it("oferece corrigir e remover numa penalidade ativa", () => {
    const { onRevoke, onEdit } = render({});

    act(() => buttonByText(texts.moderator.penalties.revoke)?.click());
    act(() => buttonByText(texts.moderator.penalties.edit)?.click());

    expect(onRevoke).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("não oferece ação numa penalidade já removida", () => {
    render({ status: "REMOVED", removedAt: "2026-10-30T12:00:00Z" });

    expect(buttonByText(texts.moderator.penalties.revoke)).toBeUndefined();
    expect(buttonByText(texts.moderator.penalties.edit)).toBeUndefined();
    expect(container.textContent).toContain("Removida em");
  });
});
