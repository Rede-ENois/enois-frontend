// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ card: vi.fn() }));

// The popover and the mini card are DS concerns; under test is how the app renders the trigger.
vi.mock("@rede-enois/design-system/ui", () => ({
  LoadingState: () => <span>carregando</span>,
  Button: (props: Record<string, unknown>) => <button {...props} />,
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  ProfileMiniCard: (props: Record<string, unknown>) => {
    mocks.card(props);
    return <div />;
  },
}));
vi.mock("@/lib/query-options/profiles", () => ({
  profileQueries: { byUsernameOrId: () => ({ queryKey: ["profile"], queryFn: () => null }) },
}));
vi.mock("@/lib/cosmetics", () => ({ profileCardData: (value: unknown) => value }));
vi.mock("@/lib/utils", () => ({
  cn: (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" "),
}));

const { ProfilePeek } = await import("./profile-peek");

describe("ProfilePeek", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.card.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  // A lista pode chegar sem username (a API devolve null). Não há popover a abrir, mas o layout de
  // quem chamou — truncar o nome e o tamanho da fonte — continua valendo: sem o className o nome
  // vazava do card e passava por cima do botão ao lado.
  it("mantém o className de quem chamou quando não há destino para o popover", () => {
    act(() =>
      root.render(
        <ProfilePeek username={null} name="João Batista de Macedo Júnior" className="truncate">
          João Batista de Macedo Júnior
        </ProfilePeek>,
      ),
    );

    const rendered = host.firstElementChild;
    expect(rendered?.tagName).toBe("SPAN");
    expect(rendered?.className).toBe("truncate");
    expect(rendered?.textContent).toBe("João Batista de Macedo Júnior");
    expect(host.querySelector("button")).toBeNull();
  });

  it("abre o popover com um botão quando há username", () => {
    act(() =>
      root.render(
        <ProfilePeek username="joao" name="João" className="truncate">
          João
        </ProfilePeek>,
      ),
    );

    const trigger = host.querySelector("button");
    expect(trigger).not.toBeNull();
    expect(trigger?.className).toContain("truncate");
    expect(trigger?.getAttribute("aria-label")).toBeTruthy();
  });
});
