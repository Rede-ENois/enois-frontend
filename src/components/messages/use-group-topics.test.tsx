// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { useGroupTopics } from "./use-group-topics";

const mocks = vi.hoisted(() => ({ createGroupTopic: vi.fn(), listGroupTopics: vi.fn() }));
vi.mock("@/lib/api", () => ({
  messagesApi: { createGroupTopic: mocks.createGroupTopic, listGroupTopics: mocks.listGroupTopics },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Monta o hook num container e devolve o que ele entregou mais recente ao view. */
function mountTopics(enabled = true) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  let latest: ReturnType<typeof useGroupTopics> | undefined;
  function Probe() {
    latest = useGroupTopics("c1", enabled);
    return null;
  }
  act(
    () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <Probe />
        </QueryClientProvider>,
      ) as ReactNode,
  );
  return {
    current: () => latest!,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

afterEach(() => vi.resetAllMocks());

describe("useGroupTopics", () => {
  it("cria o tópico e não deixa erro na fileira", async () => {
    mocks.listGroupTopics.mockResolvedValue({ items: [], nextCursor: null });
    mocks.createGroupTopic.mockResolvedValue({ id: "t1" });
    const mounted = mountTopics();

    await expect(mounted.current().onCreateTopic("Jogatina")).resolves.toBeNull();
    expect(mocks.createGroupTopic).toHaveBeenCalledWith("c1", "Jogatina");
    expect(mounted.current().error).toBeNull();
    mounted.unmount();
  });

  it("nome repetido volta como ALREADY_EXISTS e o texto aparece na fileira", async () => {
    mocks.listGroupTopics.mockResolvedValue({ items: [], nextCursor: null });
    mocks.createGroupTopic.mockRejectedValue(new ApiError(409, "TOPIC_EXISTS", "já existe"));
    const mounted = mountTopics();

    await expect(mounted.current().onCreateTopic("Jogatina")).resolves.toBe("ALREADY_EXISTS");
    expect(mounted.current().error).toBe(texts.messages.groupTopics.errors.nameTaken);
    mounted.unmount();
  });

  it("código que o DS não conhece vira o erro genérico", async () => {
    mocks.listGroupTopics.mockResolvedValue({ items: [], nextCursor: null });
    mocks.createGroupTopic.mockRejectedValue(new ApiError(500, "BOOM", "falhou"));
    const mounted = mountTopics();

    await expect(mounted.current().onCreateTopic("Jogatina")).resolves.toBeNull();
    expect(mounted.current().error).toBe(texts.messages.groupTopics.errors.generic);
    mounted.unmount();
  });

  it("conversa que não é grupo não pede a lista", () => {
    mocks.listGroupTopics.mockResolvedValue({ items: [], nextCursor: null });
    const mounted = mountTopics(false);

    expect(mocks.listGroupTopics).not.toHaveBeenCalled();
    mounted.unmount();
  });
});
