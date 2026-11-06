// @vitest-environment jsdom
import { act } from "react";

import type { ChangelogRelease } from "@/types/application/changelog/changelog-release";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WhatsNewModal } from "./whats-new-modal";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

const mockRelease: ChangelogRelease = {
  version: "2026.11.05",
  date: "Novembro 2026",
  title: "Novidades do Design System e Layout",
  description: "Melhorias gerais na interface.",
  items: [
    {
      id: "feature-1",
      tag: "Layout",
      title: "Nova Barra Lateral",
      description: "Navegação mais rápida.",
      steps: ["Passo 1: abra o menu", "Passo 2: clique no link"],
      action: {
        label: "Experimentar",
        to: "/feed",
      },
    },
  ],
};

describe("WhatsNewModal", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    // Para jsdom suportar renderização de diálogos do Radix UI
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders release items, tags and steps when open", async () => {
    await act(async () => {
      root.render(
        <WhatsNewModal
          open={true}
          onOpenChange={vi.fn()}
          release={mockRelease}
          whatsNewEnabled={true}
          onToggleWhatsNewEnabled={vi.fn()}
        />,
      );
    });

    expect(document.body.textContent).toContain("Novidades da Plataforma");
    expect(document.body.textContent).toContain("2026.11.05");
    expect(document.body.textContent).toContain("Nova Barra Lateral");
    expect(document.body.textContent).toContain("Layout");
    expect(document.body.textContent).toContain("Passo 1: abra o menu");
    expect(document.body.textContent).toContain("Passo 2: clique no link");
  });

  it("closes and navigates when the action button is clicked", async () => {
    const onOpenChange = vi.fn();

    await act(async () => {
      root.render(
        <WhatsNewModal
          open={true}
          onOpenChange={onOpenChange}
          release={mockRelease}
          whatsNewEnabled={true}
        />,
      );
    });

    const actionButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Experimentar"),
    );
    expect(actionButton).toBeDefined();

    await act(async () => {
      actionButton?.click();
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed" });
  });

  it("calls onToggleWhatsNewEnabled when the switch is toggled", async () => {
    const onToggle = vi.fn();

    await act(async () => {
      root.render(
        <WhatsNewModal
          open={true}
          onOpenChange={vi.fn()}
          release={mockRelease}
          whatsNewEnabled={true}
          onToggleWhatsNewEnabled={onToggle}
        />,
      );
    });

    const switchBtn = document.querySelector('button[role="switch"]') as HTMLButtonElement | null;
    expect(switchBtn).toBeDefined();

    await act(async () => {
      switchBtn?.click();
    });

    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
